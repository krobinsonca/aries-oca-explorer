import {
  LedgerTransaction,
  MissingBundle,
  extractSchemaNameFromId,
  extractSchemaNameFromCredDefId,
  matchesOCABundle,
  BundleWithLedger,
  normalizeLedgerValue,
  getLedgerDisplayName
} from './data';

const CANDYSCAN_BASE_URL = 'https://candyscan.idlab.org';
const CANDYSCAN_NETWORKS = ['CANDY_DEV', 'CANDY_TEST', 'CANDY_PROD'] as const;

// Use API route proxy in browser, direct URL on server
const getCandyscanUrl = (network: string, page: number, pageSize: number): string => {
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    // Use our API route proxy to avoid CORS (works in dev, not in static export)
    return `/api/candyscan/transactions/?network=${network}&page=${page}&pageSize=${pageSize}`;
  } else {
    // Server-side: use direct URL
    const filterTxNames = encodeURIComponent('["SCHEMA","CLAIM_DEF"]');
    return `${CANDYSCAN_BASE_URL}/txs/${network}/domain?page=${page}&pageSize=${pageSize}&filterTxNames=${filterTxNames}&sortFromRecent=true`;
  }
};

// Cache for candyscan responses to avoid repeated API calls
const candyscanCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch transactions from candyscan API
export async function fetchCandyscanTransactions(
  network: typeof CANDYSCAN_NETWORKS[number],
  page: number = 1,
  pageSize: number = 50
): Promise<{ transactions: LedgerTransaction[]; hasMore: boolean }> {
  const cacheKey = `${network}-${page}-${pageSize}`;
  const cached = candyscanCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Use proxy URL for browser, direct URL for server
    const url = getCandyscanUrl(network, page, pageSize);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Our API route returns { transactions: [...] }
    // Handle both our API format and potential direct candyscan responses
    let transactions: any[] = [];
    if (data.transactions && Array.isArray(data.transactions)) {
      transactions = data.transactions;
    } else if (Array.isArray(data)) {
      transactions = data;
    } else if (data.data && Array.isArray(data.data)) {
      transactions = data.data;
    } else if (data.value && Array.isArray(data.value)) {
      transactions = data.value;
    }

    // Transform to LedgerTransaction format
    const ledgerTransactions: LedgerTransaction[] = transactions.map((tx: any) => {
      // Extract identifier from transaction
      // Transaction structure varies - try common fields
      let identifier = '';
      let txData: any = {};

      if (tx.txn && tx.txn.data) {
        txData = tx.txn.data;
        // For SCHEMA: identifier is in data.name or we construct from schema ID
        // For CLAIM_DEF: identifier is in data.ref or we construct from cred def ID
        if (tx.txn.type === 'SCHEMA') {
          identifier = tx.txn.data?.name || tx.txn.metadata?.txnId || '';
        } else if (tx.txn.type === 'CLAIM_DEF') {
          identifier = tx.txn.data?.ref || tx.txn.metadata?.txnId || '';
        }
      } else if (tx.data) {
        txData = tx.data;
        identifier = tx.identifier || tx.id || tx.txnId || '';
      } else {
        identifier = tx.identifier || tx.id || tx.txnId || '';
        txData = tx;
      }

      return {
        seqNo: tx.seqNo || tx.txn?.seqNo || tx.txnMetadata?.seqNo || 0,
        txType: (tx.txn?.type || tx.type || tx.txType) as 'SCHEMA' | 'CLAIM_DEF',
        txTime: tx.txnTime || tx.txn?.txnTime || tx.txnMetadata?.txnTime || Date.now(),
        identifier,
        data: txData,
        network
      };
    });

    // Check if there are more pages (simplified - assume hasMore if we got full pageSize)
    const hasMore = transactions.length === pageSize;

    const result = { transactions: ledgerTransactions, hasMore };

    // Cache the result
    candyscanCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`Error fetching candyscan transactions for ${network}:`, error);
    // Return empty result on error rather than throwing
    return { transactions: [], hasMore: false };
  }
}

// Extract schema and credential definition IDs from transactions
export function extractSchemaAndCredDefIds(transactions: LedgerTransaction[]): string[] {
  const ids: string[] = [];

  for (const tx of transactions) {
    if (tx.txType === 'SCHEMA') {
      // Schema ID format: DID:2:SchemaName:Version
      // Try to extract from transaction data
      if (tx.data && tx.data.name && tx.data.version) {
        // We need the DID - try to get it from identifier or construct
        const identifier = tx.identifier || '';
        if (identifier.includes(':')) {
          ids.push(identifier);
        }
      } else if (tx.identifier && tx.identifier.includes(':2:')) {
        ids.push(tx.identifier);
      }
    } else if (tx.txType === 'CLAIM_DEF') {
      // Credential Definition ID format: DID:3:CL:SeqNo:SchemaName
      if (tx.identifier && tx.identifier.includes(':3:CL:')) {
        ids.push(tx.identifier);
      } else if (tx.data && tx.data.ref && tx.data.ref.includes(':3:CL:')) {
        ids.push(tx.data.ref);
      }
    }
  }

  return ids;
}

// Find schemas/credentials that don't have OCA bundles
export async function findMissingBundles(
  bundles: BundleWithLedger[]
): Promise<MissingBundle[]> {
  const missingBundles: MissingBundle[] = [];

  // Fetch transactions from all networks
  for (const network of CANDYSCAN_NETWORKS) {
    try {
      // Fetch first page (may need pagination later)
      const { transactions } = await fetchCandyscanTransactions(network, 1, 50);

      // Process each transaction
      for (const tx of transactions) {
        // Extract ID from transaction
        let id = '';
        let name: string | undefined;
        let version: string | undefined;

        if (tx.txType === 'SCHEMA') {
          // Schema transaction - try to get ID from various possible locations
          // Check if identifier is already a schema ID
          if (tx.identifier && tx.identifier.includes(':2:')) {
            id = tx.identifier;
            const schemaName = extractSchemaNameFromId(id);
            if (schemaName) {
              name = schemaName;
              // Extract version from ID
              const parts = id.split(':');
              if (parts.length >= 4) {
                version = parts[3];
              }
            }
          }
          // Check data for schema info
          else if (tx.data) {
            // Try to get schema name and version from data
            if (tx.data.name) {
              name = tx.data.name;
            }
            if (tx.data.version) {
              version = tx.data.version;
            }
            // If we have name and version, try to construct/use identifier
            // But we need the DID - skip if we can't get full ID
            if (tx.identifier && typeof tx.identifier === 'string' && tx.identifier.length > 0) {
              // Use identifier as-is if it looks like an ID
              if (tx.identifier.includes(':')) {
                id = tx.identifier;
              }
            }
          }

          // Skip if we don't have a valid ID
          if (!id || !id.includes(':2:')) {
            continue;
          }
        } else if (tx.txType === 'CLAIM_DEF') {
          // Credential definition transaction
          // Check if identifier is already a cred def ID
          if (tx.identifier && tx.identifier.includes(':3:CL:')) {
            id = tx.identifier;
            const schemaName = extractSchemaNameFromCredDefId(id);
            if (schemaName) {
              name = schemaName;
            }
          }
          // Check data.ref for cred def ID
          else if (tx.data && tx.data.ref && tx.data.ref.includes(':3:CL:')) {
            id = tx.data.ref;
            const schemaName = extractSchemaNameFromCredDefId(id);
            if (schemaName) {
              name = schemaName;
            }
          }
          // Check data.schemaId for schema reference
          else if (tx.data && tx.data.schemaId && tx.data.schemaId.includes(':2:')) {
            // We have a schema reference but not the cred def ID itself
            // Try to construct from schema ID - but we need seqNo which we have
            // For now, skip since we can't construct cred def ID without more info
            continue;
          } else {
            continue;
          }

          // Skip if we don't have a valid ID
          if (!id || !id.includes(':3:CL:')) {
            continue;
          }
        } else {
          continue;
        }

        // Check if this ID has an OCA bundle
        if (!matchesOCABundle(id, bundles)) {
          // Normalize network name
          const networkNormalized = normalizeLedgerValue(network.toLowerCase().replace('_', '-'));
          const networkDisplayName = getLedgerDisplayName(networkNormalized);

          // Construct explorer URL
          const explorerRoot = CANDYSCAN_BASE_URL;
          const explorerUrl = `${explorerRoot}/tx/${network}/domain/${tx.seqNo}`;

          missingBundles.push({
            id,
            type: tx.txType,
            name,
            version,
            seqNo: tx.seqNo,
            txTime: tx.txTime,
            network,
            networkNormalized,
            networkDisplayName,
            explorerUrl
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${network} transactions:`, error);
      // Continue with other networks on error
    }
  }

  // Sort by transaction time (most recent first)
  missingBundles.sort((a, b) => b.txTime - a.txTime);

  return missingBundles;
}

