// Compare bundle data fetch between local and build environments
const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
const BUNDLE_LIST_FILE = "ocabundleslist.json";

async function compareFetch() {
  try {
    console.log("=== Comparing Bundle Data Fetch ===\n");

    // 1. Fetch the raw bundle data
    console.log("1. Fetching raw bundle data...");
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const body = await response.text();
    console.log(`   Raw response length: ${body.length} characters`);

    const options = JSON.parse(body);
    console.log(`   Total bundles parsed: ${options.length}`);

    // 2. Check for Vancouver bundles specifically
    const vancouverBundles = options.filter(bundle =>
      bundle.org && bundle.org.includes('Vancouver')
    );
    console.log(`   Vancouver bundles found: ${vancouverBundles.length}`);

    vancouverBundles.forEach(bundle => {
      console.log(`      - ${bundle.name} (${bundle.id})`);
      console.log(`        OCA Bundle: ${bundle.ocabundle}`);
    });

    // 3. Check for any bundles that might be problematic
    console.log("\n2. Checking for potential issues...");

    const bundlesWithMissingFields = options.filter(bundle =>
      !bundle.id || !bundle.name || !bundle.ocabundle
    );

    if (bundlesWithMissingFields.length > 0) {
      console.log(`   Bundles with missing required fields: ${bundlesWithMissingFields.length}`);
      bundlesWithMissingFields.forEach(bundle => {
        console.log(`      - Missing fields in: ${JSON.stringify(bundle, null, 2)}`);
      });
    } else {
      console.log(`   ✅ All bundles have required fields`);
    }

    // 4. Look for any potential encoding or parsing issues
    console.log("\n3. Checking bundle IDs and names...");
    const problematicBundles = options.filter(bundle => {
      const hasWeirdChars = /[^\x20-\x7E]/.test(bundle.id || '') ||
                           /[^\x20-\x7E]/.test(bundle.name || '');
      return hasWeirdChars;
    });

    if (problematicBundles.length > 0) {
      console.log(`   Bundles with non-ASCII characters: ${problematicBundles.length}`);
      problematicBundles.forEach(bundle => {
        console.log(`      - ${bundle.name} (${bundle.id})`);
      });
    } else {
      console.log(`   ✅ All bundle IDs and names are clean`);
    }

    // 5. Check for duplicates by ID (this might cause filtering)
    console.log("\n4. Checking for duplicate IDs...");
    const idCount = {};
    options.forEach(bundle => {
      const id = bundle.id;
      idCount[id] = (idCount[id] || 0) + 1;
    });

    const duplicates = Object.entries(idCount).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`   Duplicate IDs found: ${duplicates.length}`);
      duplicates.forEach(([id, count]) => {
        console.log(`      - ${id}: ${count} occurrences`);
      });
    } else {
      console.log(`   ✅ No duplicate IDs found`);
    }

    // 6. Summary
    console.log("\n=== SUMMARY ===");
    console.log(`Raw bundles: ${options.length}`);
    console.log(`Vancouver bundles: ${vancouverBundles.length}`);
    console.log(`Expected after fetch: ${options.length} (should match build input)`);

  } catch (error) {
    console.error('Error:', error);
  }
}

compareFetch();