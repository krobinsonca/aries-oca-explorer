import OverlayBundleFactory from "@/app/services/OverlayBundleFactory";

// Data source URLs
export const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
export const BUNDLE_LIST_FILE = "ocabundleslist.json";
export const GITHUB_RAW_URL = "https://raw.githubusercontent.com/bcgov/aries-oca-bundles/main";

// Interface for OCA bundle with ledger information
export interface BundleWithLedger {
  id: string;
  ids: string[]; // All IDs associated with this OCA bundle (schema + credential definition)
  org: string;
  name: string;
  desc: string;
  type: string;
  ocabundle: string;
  shasum: string;
  ledger?: string;
  ledgerUrl?: string;
  ledgerDisplayName?: string; // User-friendly display name
  ledgerNormalized?: string; // Normalized value for consistent filtering
  // Per-ID ledger mapping: maps each ID to its specific ledger info
  // This ensures multi-ledger bundles have correct explorer URLs per identifier
  idLedgerMap?: Record<string, {
    ledger: string;
    ledgerUrl?: string;
    ledgerNormalized: string;
  }>;
}

// Interface for ledger filter options
export interface LedgerOption {
  value: string;
  label: string;
  count: number;
}

// Interface for bundle filters
export interface BundleFilters {
  ledger?: string;
  searchTerm?: string;
}

// Cache for README content to avoid repeated fetches
// Includes timestamp for TTL-based expiration
const readmeCache = new Map<string, {
  ledger?: string;
  ledgerUrl?: string;
  ledgerMap?: Map<string, { ledger: string; ledgerUrl?: string }>;
  timestamp: number;
}>();

// Cache TTL for successful README fetches: 10 minutes
const README_CACHE_TTL = 10 * 60 * 1000;
// Cache TTL for failed README fetches: 30 seconds (short to allow retry later)
const README_FAIL_CACHE_TTL = 30 * 1000;

// Cache for bundle list to ensure consistency across generateStaticParams and page rendering
let bundleListCache: {
  bundles: BundleWithLedger[];
  timestamp: number;
  baseUrl: string;
} | null = null;

// Cache TTL: 5 minutes (enough for a single build, but prevents stale data across builds)
const BUNDLE_LIST_CACHE_TTL = 5 * 60 * 1000;

// Current base URL (can be overridden for dev mode)
let currentBaseUrl: string = BUNDLE_LIST_URL;

// Get the current bundle list URL
export function getBundleListUrl(): string {
  return currentBaseUrl;
}

// Set the bundle list URL (for dev mode switching)
export function setBundleListUrl(url: string): void {
  if (url !== currentBaseUrl) {
    console.log(`Bundle URL changed from ${currentBaseUrl} to ${url} - clearing cache`);
    currentBaseUrl = url;
    // Clear cache when URL changes
    bundleListCache = null;
  }
}

// Normalize ledger value for consistent filtering
export function normalizeLedgerValue(ledger: string | undefined): string {
  if (!ledger) return "unknown";

  // Convert to lowercase first
  let normalized = ledger.toLowerCase();

  // Handle special legacy cases that don't follow standard patterns
  const specialCases: Record<string, string> = {
    'local:test': 'localhost-test',
    'localhost:test': 'localhost-test',
  };

  if (specialCases[normalized]) {
    return specialCases[normalized];
  }

  // Apply fallback logic: replace non-alphanumeric with hyphens
  normalized = normalized.replace(/[^a-z0-9]/g, '-');

  // Clean up multiple consecutive hyphens and leading/trailing hyphens
  normalized = normalized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  return normalized;
}

// Get a user-friendly display name for a ledger
export function getLedgerDisplayName(ledger: string | undefined): string {
  if (!ledger) return "Unknown Ledger";

  // Check for did:webvh patterns first (before normalization)
  const webvhPattern = ledger.match(/^webvh:bcgov:(sandbox|dev|test|prod)$/i);
  if (webvhPattern) {
    const env = webvhPattern[1].toLowerCase();
    switch (env) {
      case "sandbox":
        return "BC Gov did:webvh Sandbox Server";
      case "dev":
        return "BC Gov did:webvh Development Server";
      case "test":
        return "BC Gov did:webvh Test Server";
      case "prod":
        return "BC Gov did:webvh Production Server";
    }
  }

  // Check if we have a normalized mapping
  const normalized = normalizeLedgerValue(ledger);

  // Return a clean, readable version
  switch (normalized) {
    case "candy-prod":
      return "CANdy Production";
    case "candy-dev":
      return "CANdy Development";
    case "candy-test":
      return "CANdy Test";
    case "bcovrin-test":
      return "BCovrin Test";
    case "mainnet":
      return "Sovrin MainNet";
    case "testnet":
      return "Sovrin TestNet";
    default:
      // For unknown cases, use the original ledger value from the README table
      // This preserves the exact capitalization from the source data
      return ledger;
  }
}

// Map normalized ledger ids to canonical explorer URLs
function getLedgerExplorerUrl(ledgerNormalized: string | undefined): string | undefined {
  if (!ledgerNormalized) return undefined;

  switch (ledgerNormalized) {
    case "candy-prod":
      return "https://candyscan.digitaltrust.gov.bc.ca/home/CANDY_PROD";
    case "candy-dev":
      return "https://candyscan.digitaltrust.gov.bc.ca/home/CANDY_DEV";
    case "candy-test":
      return "https://candyscan.digitaltrust.gov.bc.ca/home/CANDY_TEST";
    case "bcovrin-test":
      return "https://indyscan.bcovrin.vonx.io/home/BCOVRIN_TEST";
    default:
      return undefined;
  }
}

// Extract sequence number from credential definition ID
// Format: DID:3:CL:SeqNo:SchemaName
export function extractCredDefSeqNo(credDefId: string): string | undefined {
  const match = credDefId.match(/:3:CL:(\d+):/);
  return match ? match[1] : undefined;
}

// Extract sequence number from schema ID (requires credential definition ID)
// Schema IDs don't contain seq numbers directly, but we can get it from the cred def
export function extractSchemaSeqNo(schemaId: string, credDefIds: string[]): string | undefined {
  // Find a credential definition ID that references this schema
  const schemaName = schemaId.split(':')[2]; // Extract schema name from schema ID
  console.log(`Looking for schema name "${schemaName}" in cred def IDs:`, credDefIds);

  // Try exact match first
  const matchingCredDef = credDefIds.find(credDefId => credDefId.includes(`:${schemaName}`));
  if (matchingCredDef) {
    console.log(`Found matching cred def for schema "${schemaName}": ${matchingCredDef}`);
    return extractCredDefSeqNo(matchingCredDef);
  } else {
    console.log(`No matching cred def found for schema "${schemaName}"`);
    return undefined;
  }
}

// Alternative approach: extract sequence number directly from schema ID if it follows a pattern
// Some schema IDs might have sequence numbers embedded
export function extractSchemaSeqNoFromId(schemaId: string): string | undefined {
  console.log(`Trying to extract seqNo directly from schema ID: ${schemaId}`);

  // Try to extract sequence number from schema ID pattern
  // This might work for some ledger implementations
  const parts = schemaId.split(':');
  console.log(`Schema ID parts:`, parts);
  if (parts.length >= 4) {
    // Check if the last part before version is a number
    const potentialSeqNo = parts[parts.length - 2];
    console.log(`Potential seqNo from schema ID: ${potentialSeqNo}`);
    if (/^\d+$/.test(potentialSeqNo)) {
      console.log(`Found seqNo in schema ID: ${potentialSeqNo}`);
      return potentialSeqNo;
    }
  }

  // Try a different approach - look for any numeric part in the schema ID
  for (let i = 0; i < parts.length; i++) {
    if (/^\d+$/.test(parts[i])) {
      console.log(`Found numeric part in schema ID at position ${i}: ${parts[i]}`);
      return parts[i];
    }
  }
  console.log(`No seqNo found in schema ID`);
  return undefined;
}

// Construct transaction explorer URL for a given ID
export function constructExplorerUrl(
  id: string,
  ledgerNormalized: string | undefined,
  allIds: string[]
): string | undefined {
  if (!ledgerNormalized) return undefined;

  const baseUrl = getLedgerExplorerUrl(ledgerNormalized);
  if (!baseUrl) return undefined;

  // Extract the explorer root by removing the /home/<network> path
  const explorerRoot = baseUrl.replace(/\/home\/[^/]+$/, '');

  // Convert ledger normalized value to the correct network format for URLs
  const networkName = ledgerNormalized.toUpperCase().replace(/-/g, '_');

  if (id.includes(':3:CL:')) {
    // Credential Definition ID - extract sequence number
    const seqNo = extractCredDefSeqNo(id);
    if (seqNo) {
      return `${explorerRoot}/tx/${networkName}/domain/${seqNo}`;
    }
  } else {
    // Schema ID - no hyperlink for now
    return undefined;
  }

  return undefined;
}

// Extract ledger information from README content
// Returns a map of schema IDs to their ledger info, plus a default (first entry)
export function extractLedgerFromReadme(readmeContent: string): {
  ledger?: string;
  ledgerUrl?: string;
  ledgerMap?: Map<string, { ledger: string; ledgerUrl?: string }>;
} {
  const lines = readmeContent.split("\n");
  let ledger: string | undefined;
  let ledgerUrl: string | undefined;
  const ledgerMap = new Map<string, { ledger: string; ledgerUrl?: string }>();

  // Look for the table header and extract ledger info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line contains the table header
    if (line.includes("| Identifier") && line.includes("| Location") && line.includes("| URL")) {
      // Look for all data rows after the separator line
      for (let j = i + 2; j < lines.length; j++) {
        const dataLine = lines[j].trim();
        // Stop if we hit another table or section
        if (dataLine.startsWith('##') || (dataLine.includes("|") && dataLine.includes("---"))) {
          break;
        }
        if (dataLine && dataLine.includes("|") && !dataLine.includes("---")) {
          // Parse the table row: Identifier | Location | URL
          const parts = dataLine.split("|").map(p => p.trim()).filter(p => p);
          if (parts.length >= 3) {
            const identifier = parts[0];
            const location = parts[1];
            const url = parts[2];

            // Store in map for this specific identifier
            ledgerMap.set(identifier, { ledger: location, ledgerUrl: url });

            // Use first entry as default
            if (!ledger) {
              ledger = location;
              ledgerUrl = url;
            }
          }
        }
      }
      break;
    }
  }

  return { ledger, ledgerUrl, ledgerMap: ledgerMap.size > 0 ? ledgerMap : undefined };
}

// Fetch README for a specific schema to get ledger information
export async function fetchSchemaReadme(ocabundle: string): Promise<{
  ledger?: string;
  ledgerUrl?: string;
  ledgerMap?: Map<string, { ledger: string; ledgerUrl?: string }>;
}> {
  const now = Date.now();

  // Check cache first (with TTL expiration)
  if (readmeCache.has(ocabundle)) {
    const cached = readmeCache.get(ocabundle)!;
    const cacheAge = now - cached.timestamp;
    const ttl = cached.ledgerMap ? README_CACHE_TTL : README_FAIL_CACHE_TTL;
    if (cacheAge < ttl) {
      return { ledger: cached.ledger, ledgerUrl: cached.ledgerUrl, ledgerMap: cached.ledgerMap };
    }
    // Cache expired, remove it
    readmeCache.delete(ocabundle);
  }

  // Retry logic for failed fetches with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Convert OCABundle.json path to README.md path
      const readmePath = ocabundle.replace("OCABundle.json", "README.md");
      const readmeUrl = `${GITHUB_RAW_URL}/${readmePath}`;

      // Increased timeout for CI environments (30 seconds)
      // Use AbortSignal.timeout if available, otherwise fallback
      const timeoutMs = 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(readmeUrl, {
        signal: controller.signal as AbortSignal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't log 404s as they're expected for many bundles
        if (response.status !== 404) {
          console.warn(`Failed to fetch README for ${ocabundle}: ${response.status}`);
        }
        // Cache the failure briefly to avoid hammering
        readmeCache.set(ocabundle, { timestamp: now });
        return {};
      }

      const readmeContent = await response.text();
      const ledgerInfo = extractLedgerFromReadme(readmeContent);

      // Cache the result with timestamp (even if empty, for short period)
      readmeCache.set(ocabundle, { ...ledgerInfo, timestamp: now });
      return ledgerInfo;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTimeout = lastError.name.includes('TimeoutError') ||
                        lastError.message.includes('aborted');

      if (isTimeout) {
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s with jitter
          const delay = (Math.pow(2, attempt + 1) * 1000) + Math.random() * 1000;
          console.log(`Retry ${attempt + 1}/${maxRetries} for README: ${ocabundle} after ${Math.round(delay)}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // For non-timeout errors, log and stop retrying
        console.warn(`Error fetching README for ${ocabundle}:`, lastError.message);
        break;
      }
    }
  }

  // Cache the failure briefly
  readmeCache.set(ocabundle, { timestamp: Date.now() });
  return {};
}

// Enhanced function to fetch bundle list with ledger information
export async function fetchOverlayBundleList(): Promise<BundleWithLedger[]> {
  // Return cached result if available and fresh (within TTL)
  // This ensures consistency between generateStaticParams and page rendering during build
  const now = Date.now();
  if (bundleListCache &&
      (now - bundleListCache.timestamp) < BUNDLE_LIST_CACHE_TTL &&
      bundleListCache.baseUrl === currentBaseUrl) {
    console.log('fetchOverlayBundleList: Using cached bundle list');
    return bundleListCache.bundles;
  }

  try {
    // Add cache-busting to ensure fresh data from CDN
    // But only on the first fetch - subsequent calls in the same build will use cache
    const cacheBuster = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const url = `${currentBaseUrl}/${BUNDLE_LIST_FILE}?t=${cacheBuster}&r=${randomSuffix}&nocache=1`;

    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000) // 15 second timeout for bundle list
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

        const body = await response.text();
        const responseData = JSON.parse(body);
        // Handle both array and object with 'value' property structures
        const options: any[] = Array.isArray(responseData) ? responseData : (responseData.value || responseData);

    // Group bundles by ocabundle path and collect all IDs for each unique OCA bundle
    const bundleGroups = options.reduce((acc, bundle) => {
      const existing = acc.find((b: any) => b.ocabundle === bundle.ocabundle);
      if (existing) {
        // Add this ID to the existing bundle's IDs array
        existing.ids.push(bundle.id);
      } else {
        // Create new bundle with IDs array
        acc.push({
          ...bundle,
          ids: [bundle.id]
        });
      }
      return acc;
    }, [] as any[]);

    console.log(`Deduplication: ${options.length} -> ${bundleGroups.length} unique OCA bundles`);

    // Enhance OCA bundles with ledger information
    const enhancedBundles: BundleWithLedger[] = [];

    // Process in smaller batches to avoid overwhelming the GitHub API
    const batchSize = 3; // Reduced from 5 to 3
    for (let i = 0; i < bundleGroups.length; i += batchSize) {
      const batch = bundleGroups.slice(i, i + batchSize);

      const batchPromises = batch.map(async (bundle: any): Promise<BundleWithLedger[]> => {
        try {
          const ledgerInfo = await fetchSchemaReadme(bundle.ocabundle);

          // If we have a ledgerMap with multiple entries, group IDs by ledger
          // This creates separate bundle entries for each ledger (ocabundle + ledger = unique)
          if (ledgerInfo.ledgerMap && ledgerInfo.ledgerMap.size > 0) {
            // Group IDs by their ledger (normalized)
            const ledgerGroups = new Map<string, {
              ids: string[];
              ledger: string;
              ledgerUrl?: string;
            }>();

            for (const id of bundle.ids) {
              const idLedgerInfo = ledgerInfo.ledgerMap.get(id);
              if (idLedgerInfo) {
                const ledgerKey = normalizeLedgerValue(idLedgerInfo.ledger);
                if (!ledgerGroups.has(ledgerKey)) {
                  ledgerGroups.set(ledgerKey, {
                    ids: [],
                    ledger: idLedgerInfo.ledger,
                    ledgerUrl: idLedgerInfo.ledgerUrl
                  });
                }
                ledgerGroups.get(ledgerKey)!.ids.push(id);
              } else {
                // IDs without specific ledger mapping go to default ledger
                const defaultLedger = ledgerInfo.ledger || 'unknown';
                const defaultKey = normalizeLedgerValue(defaultLedger);
                if (!ledgerGroups.has(defaultKey)) {
                  ledgerGroups.set(defaultKey, {
                    ids: [],
                    ledger: defaultLedger,
                    ledgerUrl: ledgerInfo.ledgerUrl
                  });
                }
                ledgerGroups.get(defaultKey)!.ids.push(id);
              }
            }

            // Create separate bundle entries for each ledger (ocabundle + ledger = unique)
            const bundles: BundleWithLedger[] = [];

            Array.from(ledgerGroups.entries()).forEach(([ledgerKey, ledgerData]) => {
              const ledgerNormalized = ledgerKey;
              const ledgerDisplayName = getLedgerDisplayName(ledgerData.ledger);

              // Build idLedgerMap for THIS specific ledger - only includes IDs in ledgerData.ids
              const idLedgerMap: Record<string, { ledger: string; ledgerUrl?: string; ledgerNormalized: string }> = {};
              for (const id of ledgerData.ids) {
                const idLedgerInfo = ledgerInfo.ledgerMap?.get(id);
                if (idLedgerInfo) {
                  const normalized = normalizeLedgerValue(idLedgerInfo.ledger);
                  idLedgerMap[id] = {
                    ledger: idLedgerInfo.ledger,
                    ledgerUrl: idLedgerInfo.ledgerUrl,
                    ledgerNormalized: normalized
                  };
                } else {
                  // Fallback: use the README's default ledger info, not the group's ledger
                  // This handles cases where an ID wasn't found in ledgerInfo.ledgerMap
                  idLedgerMap[id] = {
                    ledger: ledgerInfo.ledger || 'unknown',
                    ledgerUrl: ledgerInfo.ledgerUrl,
                    ledgerNormalized: normalizeLedgerValue(ledgerInfo.ledger)
                  };
                }
              }

              // Use the first ID as the primary ID (prefer schema ID over cred def if available)
              const schemaIds = ledgerData.ids.filter(id => id.includes(':2:'));
              const primaryId = schemaIds.length > 0 ? schemaIds[0] : ledgerData.ids[0];

              bundles.push({
                ...bundle,
                id: primaryId, // Primary ID for this ledger
                ids: ledgerData.ids, // All IDs for this ocabundle + ledger combination
                ledger: ledgerData.ledger,
                ledgerUrl: ledgerData.ledgerUrl,
                ledgerDisplayName: ledgerDisplayName,
                ledgerNormalized: ledgerNormalized,
                idLedgerMap: idLedgerMap
              });
            });

            return bundles.length > 0 ? bundles : [{
              ...bundle,
              ledger: ledgerInfo.ledger,
              ledgerUrl: ledgerInfo.ledgerUrl,
              ledgerDisplayName: ledgerInfo.ledger ? getLedgerDisplayName(ledgerInfo.ledger) : undefined,
              ledgerNormalized: ledgerInfo.ledger ? normalizeLedgerValue(ledgerInfo.ledger) : undefined,
              idLedgerMap: undefined
            }];
          } else {
            // Single ledger entry - keep all IDs together
            const ledgerNormalized = ledgerInfo.ledger ? normalizeLedgerValue(ledgerInfo.ledger) : undefined;
            const ledgerDisplayName = ledgerInfo.ledger ? getLedgerDisplayName(ledgerInfo.ledger) : undefined;
            const explorerUrl = ledgerInfo.ledgerUrl;

            // Use first schema ID as primary if available, otherwise first ID
            const schemaIds = bundle.ids.filter((id: string) => id.includes(':2:'));
            const primaryId = schemaIds.length > 0 ? schemaIds[0] : bundle.ids[0];

            // Build idLedgerMap for single ledger case
            const singleLedgerIdLedgerMap: Record<string, { ledger: string; ledgerUrl?: string; ledgerNormalized: string }> = {};
            const normalizedLedger = ledgerInfo.ledger ? normalizeLedgerValue(ledgerInfo.ledger) : 'unknown';
            for (const id of bundle.ids) {
              singleLedgerIdLedgerMap[id] = {
                ledger: ledgerInfo.ledger || 'unknown',
                ledgerUrl: ledgerInfo.ledgerUrl,
                ledgerNormalized: normalizedLedger
              };
            }

            return [{
              ...bundle,
              id: primaryId, // Primary ID
              ids: bundle.ids, // All IDs for this bundle
              ledger: ledgerInfo.ledger,
              ledgerUrl: explorerUrl,
              ledgerDisplayName: ledgerDisplayName,
              ledgerNormalized: ledgerNormalized,
              idLedgerMap: singleLedgerIdLedgerMap
            }];
          }
        } catch (error) {
          // If README fetch fails, return bundle without ledger info
          console.warn(`Failed to fetch ledger info for ${bundle.ocabundle}:`, error);

          // Use first schema ID as primary if available
          const schemaIds = bundle.ids.filter((id: string) => id.includes(':2:'));
          const primaryId = schemaIds.length > 0 ? schemaIds[0] : bundle.ids[0];

          return [{
            ...bundle,
            id: primaryId,
            ids: bundle.ids, // Keep all IDs even without ledger info
            ledger: undefined,
            ledgerUrl: undefined,
            ledgerDisplayName: undefined,
            ledgerNormalized: undefined,
            idLedgerMap: undefined
          }];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      // Flatten the results (each promise can return multiple bundles now)
      enhancedBundles.push(...batchResults.flat());

      // Add a longer delay between batches to be more respectful to GitHub's API
      if (i + batchSize < bundleGroups.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 100ms to 200ms
      }
    }

    // Cache the result for subsequent calls during the same build
    bundleListCache = {
      bundles: enhancedBundles,
      timestamp: Date.now(),
      baseUrl: currentBaseUrl
    };

    return enhancedBundles;
  } catch (error) {
    throw new Error(`Failed to fetch Overlay Bundle List: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Helper function to extract watermark text from various object structures
function extractWatermarkFromObject(obj: any): string | object | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  // Direct watermark fields
  const directFields = ['watermarkText', 'watermark'];
  for (const field of directFields) {
    // First check if field exists and is not empty
    if (obj.hasOwnProperty(field)) {
      if (typeof obj[field] === 'string') {
        if (obj[field].trim()) {
          return obj[field];
        } else {
          // Field exists but is empty/whitespace - explicitly return undefined
          return undefined;
        }
      }
      if (typeof obj[field] === 'object' && obj[field] !== null) {
        if (obj[field].text && typeof obj[field].text === 'string') {
          if (obj[field].text.trim()) {
            return obj[field].text;
          } else {
            // Object with empty text field
            return undefined;
          }
        }
        // Handle localized watermark objects like { "en": "NON-PRODUCTION", "fr": "NON-PRODUCTION (FR)" }
        if (!obj[field].text) {
          const values = Object.values(obj[field]);
          if (values.length > 0 && values.every(v => typeof v === 'string' && v.trim())) {
            return obj[field]; // Return the full localized object
          }
          // Check if it's a localized object with empty values
          if (values.length > 0 && values.every(v => typeof v === 'string' && !v.trim())) {
            return undefined;
          }
        }
      }
    }
  }

  // Check for direct watermark field in the overlay (not just nested in branding/metadata)
  if (obj.watermark && typeof obj.watermark === 'string' && obj.watermark.trim()) {
    return obj.watermark;
  }

  // Additional check: if watermark field exists but is empty/whitespace, explicitly return undefined
  if (obj.hasOwnProperty('watermark') && typeof obj.watermark === 'string' && !obj.watermark.trim()) {
    return undefined;
  }

  // Check nested structures
  if (obj.branding) {
    const brandingWatermark = extractWatermarkFromObject(obj.branding);
    if (brandingWatermark) return brandingWatermark;
  }

  if (obj.metadata) {
    const metadataWatermark = extractWatermarkFromObject(obj.metadata);
    if (metadataWatermark) return metadataWatermark;
  }

  return undefined;
}

export async function fetchOverlayBundleData(option: any, opts?: { includeTestData?: boolean }) {
  try {
    // Ensure proper URL construction without path doubling
    const baseUrl = currentBaseUrl.endsWith('/') ? currentBaseUrl.slice(0, -1) : currentBaseUrl;
    const bundlePath = option.ocabundle.startsWith('/') ? option.ocabundle.slice(1) : option.ocabundle;
    option.url = `${baseUrl}/${bundlePath}`;

    const includeTestData = opts?.includeTestData !== false;

    // Extract the base directory URL (remove the filename) for resolving relative resource URLs
    const bundleDirUrl = option.url.replace(/\/[^/]+$/, '');

    const resolveResourceUrl = (url: string | undefined): string | undefined => {
      if (!url) return url;
      // If it's already an absolute URL, return as-is
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      // If it contains a colon early on, it might be a DID or other identifier
      // Check if it looks like a DID identifier path that includes a resource path
      if (url.includes(':') && !url.startsWith('/')) {
        const parts = url.split(':');
        if (parts.length > 2 && parts[0] === 'did') {
          // This is a DID identifier - check if it contains a resource path
          if (url.includes('/resources/')) {
            // Extract just the resource path part (everything after the last /resources/)
            const resourcesIndex = url.lastIndexOf('/resources/');
            if (resourcesIndex !== -1) {
              const resourcePath = url.substring(resourcesIndex + 1); // Get '/resources/...'
              // Resolve the resource path against the bundle directory
              const cleanPath = resourcePath.replace(/^\.\//, '');
              if (cleanPath.startsWith(bundleDirUrl)) {
                return cleanPath;
              }
              return `${bundleDirUrl}/${cleanPath}`;
            }
          }
          // If it's a DID but doesn't contain /resources/, it's probably not a resource URL
          // Return as-is (might be used for other purposes)
          return url;
        }
      }
      // If it's a relative path, resolve it against the bundle directory
      if (url.startsWith('/')) {
        // Absolute path from root - resolve against base URL domain
        try {
          const urlObj = new URL(bundleDirUrl);
          return `${urlObj.origin}${url}`;
        } catch {
          return url;
        }
      }
      // Relative path - resolve against bundle directory
      const cleanPath = url.replace(/^\.\//, '');
      // Ensure we don't double up the bundleDirUrl if the path already contains it
      if (cleanPath.startsWith(bundleDirUrl)) {
        return cleanPath;
      }
      return `${bundleDirUrl}/${cleanPath}`;
    };

    // Fetch raw overlay data first so we can modify it before creating OverlayBundle
    const rawOverlayPromise = OverlayBundleFactory.fetchRawOverlayBundle(option.url);
    const dataPromise = includeTestData
      ? OverlayBundleFactory.fetchOverlayBundleData(option.url)
      : Promise.resolve({} as Record<string, string>);

    const [rawOverlayResult, dataResult] = await Promise.allSettled([
      rawOverlayPromise,
      dataPromise,
    ]);

    let overlay = undefined;
    let data = undefined;
    let watermarkText = undefined;

    // Process raw overlay data to resolve relative resource URLs
    if (rawOverlayResult.status === 'fulfilled') {
      const rawData = rawOverlayResult.value;
      if (Array.isArray(rawData) && rawData.length > 0) {
        const firstElement = rawData[0];

        // Recursively resolve resource URLs in the overlay structure
        const resolveUrlsInObject = (obj: any): void => {
          if (!obj || typeof obj !== 'object') return;

          // Resolve branding URLs
          if (obj.branding) {
            if (obj.branding.logo) obj.branding.logo = resolveResourceUrl(obj.branding.logo);
            if (obj.branding.backgroundImage) obj.branding.backgroundImage = resolveResourceUrl(obj.branding.backgroundImage);
            if (obj.branding.backgroundImageSlice) obj.branding.backgroundImageSlice = resolveResourceUrl(obj.branding.backgroundImageSlice);
          }

          // Recursively process nested objects and arrays
          for (const key in obj) {
            if (Array.isArray(obj[key])) {
              obj[key].forEach((item: any) => resolveUrlsInObject(item));
            } else if (obj[key] && typeof obj[key] === 'object') {
              resolveUrlsInObject(obj[key]);
            }
          }
        };

        resolveUrlsInObject(firstElement);

        // Create overlay bundle from modified data
        overlay = OverlayBundleFactory.createOverlayBundle(option.id, firstElement);
      }
    }

    if (includeTestData) {
      if (dataResult.status === 'fulfilled') {
        data = dataResult.value;
      }
    } else {
      data = {};
    }

    // Extract watermark from raw overlay data
    if (rawOverlayResult.status === 'fulfilled') {
      try {
        const raw = rawOverlayResult.value;
        // Extract watermark from the first element of the array
        if (Array.isArray(raw) && raw.length > 0) {
          const firstElement = raw[0];
          // Check if it has overlays array and search through them
          if (firstElement.overlays && Array.isArray(firstElement.overlays)) {
            for (const overlayItem of firstElement.overlays) {
              const found = extractWatermarkFromObject(overlayItem);
              if (found) {
                watermarkText = found;
                break;
              }
            }
          }
          // If not found in overlays, try the root element
          if (!watermarkText) {
            watermarkText = extractWatermarkFromObject(firstElement);
          }
        }

      } catch (error) {
        console.error('Error extracting watermark from raw data:', error);
      }
    } else if (rawOverlayResult.status === 'rejected') {
      console.error('Failed to fetch raw overlay data:', rawOverlayResult.reason);
    }

    // Also try to extract watermark from processed overlay if not found in raw data
    if (!watermarkText && overlay) {
      watermarkText = extractWatermarkFromObject(overlay);
    }




    if (!overlay) {
      throw new Error(`Failed to fetch Overlay Bundle for ${option.id}: ${
        rawOverlayResult.status === 'rejected' ? rawOverlayResult.reason.message : 'Unknown error'
      }`);
    }

    return { overlay, data, watermarkText };
  } catch (error) {
    throw new Error(`Failed to fetch Overlay Bundle Data for ${option.id}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`);
  }
}

// Group bundles by ledger for organized display
export function groupBundlesByLedger(bundles: BundleWithLedger[]): Record<string, BundleWithLedger[]> {
  const grouped = bundles.reduce((acc, bundle) => {
    const ledger = bundle.ledgerNormalized || 'unknown';
    if (!acc[ledger]) {
      acc[ledger] = [];
    }
    acc[ledger].push(bundle);
    return acc;
  }, {} as Record<string, BundleWithLedger[]>);

  // Sort each group by name
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  });

  // Enforce a specific display order for ledger groups by normalized key
  const ORDER: string[] = [
    'candy-prod',
    'candy-test',
    'candy-dev',
    'sovrn-mainnet',
    'sovrin-stagingnet',
    'bcovrin-test',
  ];

  const ordered: Record<string, BundleWithLedger[]> = {};

  // First add known keys in specified order if they exist
  for (const key of ORDER) {
    if (grouped[key]) {
      ordered[key] = grouped[key];
    }
  }

  // Append any remaining groups not explicitly ordered, sorted by their display name
  const remainingKeys = Object.keys(grouped).filter(k => !ORDER.includes(k));
  remainingKeys.sort((a, b) => {
    const aName = grouped[a]?.[0]?.ledgerDisplayName || a;
    const bName = grouped[b]?.[0]?.ledgerDisplayName || b;
    return aName.localeCompare(bName);
  });
  for (const key of remainingKeys) {
    ordered[key] = grouped[key];
  }

  return ordered;
}

// Get available ledger options for filtering
export function getAvailableLedgerOptions(bundles: BundleWithLedger[]): LedgerOption[] {
  const ledgerCounts = bundles.reduce((acc, bundle) => {
    const ledger = bundle.ledgerNormalized || 'unknown';
    acc[ledger] = (acc[ledger] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ORDER: string[] = [
    'candy-prod',
    'candy-test',
    'candy-dev',
    'sovrn-mainnet',
    'sovrin-stagingnet',
    'bcovrin-test',
  ];

  const options = Object.entries(ledgerCounts)
    .map(([ledger, count]) => ({
      value: ledger,
      label: bundles.find(b => b.ledgerNormalized === ledger)?.ledgerDisplayName || ledger,
      count
    }));

  // Sort by custom order first, then by label
  options.sort((a, b) => {
    const ai = ORDER.indexOf(a.value);
    const bi = ORDER.indexOf(b.value);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.label.localeCompare(b.label);
  });

  return options;
}

const UNKNOWN_LEDGER_KEY = 'unknown';
const PRODUCTION_LEDGER_KEYS = new Set([
  'candy-prod',
  'sovrn-mainnet',
  'mainnet',
  'prod',
]);
const NON_PRODUCTION_LEDGER_KEYS = new Set([
  'candy-test',
  'candy-dev',
  'sovrin-stagingnet',
  'bcovrin-test',
  'test',
  'dev',
]);

// Determine if a ledger is a production ledger
export function isProductionLedger(ledgerNormalized: string | undefined): boolean {
  if (!ledgerNormalized) return false;
  const normalized = ledgerNormalized.toLowerCase();
  if (normalized === UNKNOWN_LEDGER_KEY) return false;
  return PRODUCTION_LEDGER_KEYS.has(normalized);
}

// Determine if a ledger is a non-production (dev/test) ledger
export function isNonProductionLedger(ledgerNormalized: string | undefined): boolean {
  if (!ledgerNormalized) return false;
  const normalized = ledgerNormalized.toLowerCase();
  if (normalized === UNKNOWN_LEDGER_KEY) return false;
  return NON_PRODUCTION_LEDGER_KEYS.has(normalized);
}

// Filter bundles based on search criteria
export function filterBundles(bundles: BundleWithLedger[], filters: BundleFilters): BundleWithLedger[] {
  return bundles.filter(bundle => {
    // Ledger filter
    if (filters.ledger && bundle.ledgerNormalized !== filters.ledger) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchFields = [
        bundle.name || '',
        bundle.desc || '',
        bundle.org || '',
        bundle.id || ''
      ].map(field => field.toLowerCase());

      const matchesSearch = searchFields.some(field => field.includes(searchTerm));
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}

// Extract schema name from schema ID
// Format: DID:2:SchemaName:Version
export function extractSchemaNameFromId(schemaId: string): string | undefined {
  const parts = schemaId.split(':');
  if (parts.length >= 3 && parts[1] === '2') {
    return parts[2];
  }
  return undefined;
}

// Extract schema name from credential definition ID
// Format: DID:3:CL:SeqNo:SchemaName
export function extractSchemaNameFromCredDefId(credDefId: string): string | undefined {
  const parts = credDefId.split(':');
  if (parts.length >= 5 && parts[1] === '3' && parts[2] === 'CL') {
    return parts[4];
  }
  return undefined;
}