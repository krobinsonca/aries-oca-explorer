// Simple test to see deduplication vs final result
const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
const BUNDLE_LIST_FILE = "ocabundleslist.json";

async function simpleTest() {
  try {
    console.log("=== Simple Bundle Count Test ===\n");

    // 1. Get raw bundles
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);
    const rawBundles = await response.json();
    console.log(`1. Raw bundles: ${rawBundles.length}`);

    // 2. Deduplicate by ocabundle path (same logic as the app)
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
    console.log(`2. After deduplication: ${bundleGroups.length} unique OCA bundles`);

    // 3. List some examples
    console.log("\n3. First 10 unique bundles:");
    bundleGroups.slice(0, 10).forEach((bundle, i) => {
      console.log(`   ${i+1}. ${bundle.name} (${bundle.ids.length} IDs)`);
    });

    // 4. Check specifically for Vancouver bundles
    const vancouverBundles = bundleGroups.filter(b =>
      b.org && b.org.includes('Vancouver')
    );
    console.log(`\n4. Vancouver bundles: ${vancouverBundles.length}`);
    vancouverBundles.forEach(bundle => {
      console.log(`   - ${bundle.name}`);
      console.log(`     OCA Bundle: ${bundle.ocabundle}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

simpleTest();