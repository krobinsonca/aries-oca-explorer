import OverlayBundleFactory from "@/app/services/OverlayBundleFactory";

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
const readmeCache = new Map<string, { ledger?: string; ledgerUrl?: string }>();

// Ledger normalization mapping
// Maps various formats to consistent internal values
const LEDGER_NORMALIZATION_MAP: Record<string, string> = {
  // Candy ledger variations
  'candy:prod': 'candy-prod',
  'candy:dev': 'candy-dev',
  'candy:test': 'candy-test',
  'CANDY:PROD': 'candy-prod',
  'CANDY:DEV': 'candy-dev',
  'CANDY:TEST': 'candy-test',
  'CANDY-Prod': 'candy-prod',
  'CANDY-Dev': 'candy-dev',
  'CANDY-Test': 'candy-test',
  'Candy:Prod': 'candy-prod',
  'Candy:Dev': 'candy-dev',
  'Candy:Test': 'candy-test',

  // BCovrin ledger variations
  'bcovrin:test': 'bcovrin-test',
  'bcovrin:prod': 'bcovrin-prod',
  'BCOVRIN:TEST': 'bcovrin-test',
  'BCOVRIN:PROD': 'bcovrin-prod',
  'BCOVRIN-Test': 'bcovrin-test',
  'BCOVRIN-Prod': 'bcovrin-prod',
  'Bcovrin:Test': 'bcovrin-test',
  'Bcovrin:Prod': 'bcovrin-prod',

  // Other common variations
  'mainnet': 'mainnet',
  'testnet': 'testnet',
  'devnet': 'devnet',
  'MAINNET': 'mainnet',
  'TESTNET': 'testnet',
  'DEVNET': 'devnet',

  // Legacy mappings
  'localhost:test': 'localhost-test',
  'local:test': 'localhost-test',
};

// Normalize ledger value for consistent filtering
export function normalizeLedgerValue(ledger: string | undefined): string {
  if (!ledger) return "unknown";
  const normalized = LEDGER_NORMALIZATION_MAP[ledger] || ledger.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return normalized;
}

// Get a user-friendly display name for a ledger
export function getLedgerDisplayName(ledger: string | undefined): string {
  if (!ledger) return "Unknown Ledger";

  // Check if we have a normalized mapping
  const normalized = normalizeLedgerValue(ledger);

  // Return a clean, readable version
  switch (normalized) {
    case "candy-prod":
      return "Candy Production";
    case "candy-dev":
      return "Candy Development";
    case "candy-test":
      return "Candy Test";
    case "bcovrin-test":
      return "BCovrin Test";
    case "bcovrin-prod":
      return "BCovrin Production";
    case "mainnet":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "devnet":
      return "Development Network";
    default:
      // If no specific mapping, format the original nicely
      return ledger.split(/[-_:]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
  }
}

// Map normalized ledger ids to canonical explorer URLs
function getLedgerExplorerUrl(ledgerNormalized: string | undefined): string | undefined {
  if (!ledgerNormalized) return undefined;

  switch (ledgerNormalized) {
    case "candy-prod":
      return "https://candyscan.idlab.org/home/CANDY_PROD";
    case "candy-dev":
      return "https://candyscan.idlab.org/home/CANDY_DEV";
    case "candy-test":
      return "https://candyscan.idlab.org/home/CANDY_TEST";
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

  // Get the base URL without the /home path for transaction URLs
  const explorerRoot = baseUrl.replace('/home/CANDY_PROD', '').replace('/home/CANDY_DEV', '').replace('/home/CANDY_TEST', '');

  // Convert ledger normalized value to the correct network format for URLs
  const networkName = ledgerNormalized.toUpperCase().replace('-', '_');

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
export function extractLedgerFromReadme(readmeContent: string): { ledger?: string; ledgerUrl?: string } {
  const lines = readmeContent.split("\n");
  let ledger: string | undefined;
  let ledgerUrl: string | undefined;

  // Look for the table header and extract ledger info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line contains the table header
    if (line.includes("| Identifier") && line.includes("| Location") && line.includes("| URL")) {
      // Look for the next non-empty line after the separator line
      for (let j = i + 2; j < lines.length; j++) {
        const dataLine = lines[j].trim();
        if (dataLine && dataLine.includes("|") && !dataLine.includes("---")) {
          // Parse the table row
          const parts = dataLine.split("|").map(p => p.trim()).filter(p => p);
          if (parts.length >= 3) {
            ledger = parts[1]; // Location column
            ledgerUrl = parts[2]; // URL column
            break;
          }
        }
      }
      break;
    }
  }

  return { ledger, ledgerUrl };
}

// Fetch README for a specific schema to get ledger information
export async function fetchSchemaReadme(ocabundle: string): Promise<{ ledger?: string; ledgerUrl?: string }> {
  // Check cache first
  if (readmeCache.has(ocabundle)) {
    return readmeCache.get(ocabundle)!;
  }

  try {
    // Convert OCABundle.json path to README.md path
    const readmePath = ocabundle.replace("OCABundle.json", "README.md");
    const readmeUrl = `${GITHUB_RAW_URL}/${readmePath}`;

    const response = await fetch(readmeUrl);
    if (!response.ok) {
      const emptyResult = {};
      readmeCache.set(ocabundle, emptyResult);
      return emptyResult;
    }

    const readmeContent = await response.text();
    const ledgerInfo = extractLedgerFromReadme(readmeContent);

    // Cache the result
    readmeCache.set(ocabundle, ledgerInfo);
    return ledgerInfo;
  } catch (error) {
    const emptyResult = {};
    readmeCache.set(ocabundle, emptyResult);
    return emptyResult;
  }
}

// Enhanced function to fetch bundle list with ledger information
export async function fetchOverlayBundleList(): Promise<BundleWithLedger[]> {
  try {
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.text();
    const options: any[] = JSON.parse(body);

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

    // Process in batches to avoid overwhelming the GitHub API
    const batchSize = 5;
    for (let i = 0; i < bundleGroups.length; i += batchSize) {
      const batch = bundleGroups.slice(i, i + batchSize);

      const batchPromises = batch.map(async (bundle: any): Promise<BundleWithLedger> => {
        const ledgerInfo = await fetchSchemaReadme(bundle.ocabundle);

        // Normalize ledger value and create display name
        const ledgerNormalized = ledgerInfo.ledger ? normalizeLedgerValue(ledgerInfo.ledger) : undefined;
        const ledgerDisplayName = ledgerInfo.ledger ? getLedgerDisplayName(ledgerInfo.ledger) : undefined;
        const explorerUrl = ledgerInfo.ledgerUrl;

        return {
          ...bundle,
          ledger: ledgerInfo.ledger,
          ledgerUrl: explorerUrl,
          ledgerDisplayName: ledgerDisplayName,
          ledgerNormalized: ledgerNormalized
        };
      });

      const batchResults = await Promise.all(batchPromises);
      enhancedBundles.push(...batchResults);

      // Add a small delay between batches to be respectful to GitHub's API
      if (i + batchSize < bundleGroups.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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
    option.url = BUNDLE_LIST_URL + "/" + option.ocabundle;

    const includeTestData = opts?.includeTestData !== false;

    const overlayPromise = OverlayBundleFactory.fetchOverlayBundle(option.id, option.url);
    const rawOverlayPromise = OverlayBundleFactory.fetchRawOverlayBundle(option.url);


    const dataPromise = includeTestData
      ? OverlayBundleFactory.fetchOverlayBundleData(option.url)
      : Promise.resolve({} as Record<string, string>);

    const [overlayResult, dataResult, rawOverlayResult] = await Promise.allSettled([
      overlayPromise,
      dataPromise,
      rawOverlayPromise,
    ]);

    let overlay = undefined;
    let data = undefined;
    let watermarkText = undefined;

    if (overlayResult.status === 'fulfilled') {
      overlay = overlayResult.value;
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
            for (const overlay of firstElement.overlays) {
              const found = extractWatermarkFromObject(overlay);
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
        overlayResult.status === 'rejected' ? overlayResult.reason.message : 'Unknown error'
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