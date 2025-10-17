// Debug script to test Vancouver bundle processing
const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
const BUNDLE_LIST_FILE = "ocabundleslist.json";
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/bcgov/aries-oca-bundles/main";

async function fetchSchemaReadme(ocabundle) {
  try {
    const readmePath = ocabundle.replace("OCABundle.json", "README.md");
    const readmeUrl = `${GITHUB_RAW_URL}/${readmePath}`;

    console.log(`Fetching: ${readmeUrl}`);

    const response = await fetch(readmeUrl);
    if (!response.ok) {
      console.warn(`README not found for ${ocabundle}: ${response.status} ${response.statusText}`);
      return {};
    }

    const readmeContent = await response.text();
    const ledgerInfo = extractLedgerFromReadme(readmeContent);

    if (!ledgerInfo.ledger) {
      console.warn(`No ledger info extracted from README: ${readmeUrl}`);
    } else {
      console.log(`Found ledger info for ${ocabundle}: ${ledgerInfo.ledger}`);
    }

    return ledgerInfo;
  } catch (error) {
    console.error(`Error fetching README for ${ocabundle}:`, error);
    return {};
  }
}

function extractLedgerFromReadme(readmeContent) {
  const lines = readmeContent.split("\n");
  let ledger;
  let ledgerUrl;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes("| Identifier") && line.includes("| Location") && line.includes("| URL")) {
      const tableRows = [];

      for (let j = i + 2; j < lines.length; j++) {
        const dataLine = lines[j].trim();
        if (dataLine && dataLine.includes("|") && !dataLine.includes("---")) {
          const parts = dataLine.split("|").map(p => p.trim()).filter(p => p);
          if (parts.length >= 3) {
            tableRows.push({
              ledger: parts[1],
              ledgerUrl: parts[2]
            });
          }
        } else if (dataLine === "" || !dataLine.includes("|")) {
          break;
        }
      }

      const candyRow = tableRows.find(row =>
        row.ledger.toLowerCase().includes('candy') &&
        row.ledger.toLowerCase().includes('prod')
      );

      if (candyRow) {
        ledger = candyRow.ledger;
        ledgerUrl = candyRow.ledgerUrl;
      } else if (tableRows.length > 0) {
        ledger = tableRows[0].ledger;
        ledgerUrl = tableRows[0].ledgerUrl;
      }

      break;
    }
  }

  return { ledger, ledgerUrl };
}

async function testVancouverBundles() {
  try {
    console.log("Fetching bundle list...");
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);
    const options = await response.json();

    console.log(`Total bundles: ${options.length}`);

    // Find Vancouver bundles
    const vancouverBundles = options.filter(bundle =>
      bundle.org && bundle.org.includes('Vancouver')
    );

    console.log(`Vancouver bundles found: ${vancouverBundles.length}`);

    // Group by ocabundle
    const bundleGroups = vancouverBundles.reduce((acc, bundle) => {
      const existing = acc.find(b => b.ocabundle === bundle.ocabundle);
      if (existing) {
        existing.ids.push(bundle.id);
      } else {
        acc.push({
          ...bundle,
          ids: [bundle.id]
        });
      }
      return acc;
    }, []);

    console.log(`Unique Vancouver OCA bundles: ${bundleGroups.length}`);

    // Test README fetching for each
    for (const bundle of bundleGroups) {
      console.log(`\nTesting bundle: ${bundle.name}`);
      console.log(`OCA Bundle path: ${bundle.ocabundle}`);
      const ledgerInfo = await fetchSchemaReadme(bundle.ocabundle);
      console.log(`Result:`, ledgerInfo);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testVancouverBundles();