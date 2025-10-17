// Full test of the bundle fetching process to see what's missing
const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
const BUNDLE_LIST_FILE = "ocabundleslist.json";
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/bcgov/aries-oca-bundles/main";

// Import the actual functions from the app
const { fetchOverlayBundleList } = require('./app/lib/data.ts');

async function fullTest() {
  try {
    console.log("=== Testing full bundle fetching process ===\n");

    // 1. Get raw bundle data
    console.log("1. Fetching raw bundle list...");
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);
    const rawBundles = await response.json();
    console.log(`   Raw bundles: ${rawBundles.length}`);

    // 2. Group by ocabundle path (deduplication)
    const bundleGroups = rawBundles.reduce((acc, bundle) => {
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
    console.log(`   After deduplication: ${bundleGroups.length} unique OCA bundles`);

    // 3. Test the full fetchOverlayBundleList function
    console.log("\n2. Testing fetchOverlayBundleList function...");
    const enhancedBundles = await fetchOverlayBundleList();
    console.log(`   Enhanced bundles: ${enhancedBundles.length}`);

    // 4. Compare what we expected vs what we got
    console.log("\n3. Comparing expected vs actual...");
    if (bundleGroups.length !== enhancedBundles.length) {
      console.log(`   ❌ MISMATCH: Expected ${bundleGroups.length}, got ${enhancedBundles.length}`);

      // Find missing bundles
      const enhancedIds = new Set(enhancedBundles.map(b => b.id));
      const missing = bundleGroups.filter(b => !enhancedIds.has(b.id));

      console.log(`\n   Missing bundles (${missing.length}):`);
      missing.forEach(bundle => {
        console.log(`   - ${bundle.name} (${bundle.id})`);
      });
    } else {
      console.log(`   ✅ Match: ${enhancedBundles.length} bundles`);
    }

    // 5. Count by ledger
    console.log("\n4. Bundle count by ledger:");
    const ledgerCounts = {};
    enhancedBundles.forEach(bundle => {
      const ledger = bundle.ledgerNormalized || 'no-ledger';
      ledgerCounts[ledger] = (ledgerCounts[ledger] || 0) + 1;
    });

    Object.entries(ledgerCounts).sort().forEach(([ledger, count]) => {
      console.log(`   ${ledger}: ${count}`);
    });

    // 6. Check specifically for bundles with no ledger info
    const noLedger = enhancedBundles.filter(b => !b.ledger || !b.ledgerNormalized);
    if (noLedger.length > 0) {
      console.log(`\n5. Bundles with no ledger info (${noLedger.length}):`);
      noLedger.forEach(bundle => {
        console.log(`   - ${bundle.name}`);
        console.log(`     OCA Bundle: ${bundle.ocabundle}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fullTest();