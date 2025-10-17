// Debug script to identify which specific bundles are missing from the final output
const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
const BUNDLE_LIST_FILE = "ocabundleslist.json";
const fs = require('fs');

async function identifyMissingBundles() {
  try {
    console.log("=== Identifying Missing Bundles ===\n");

    // 1. Get expected bundles (after deduplication)
    console.log("1. Fetching and deduplicating raw bundles...");
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);
    const rawBundles = await response.json();
    console.log(`   Raw bundles: ${rawBundles.length}`);

    const expectedBundles = rawBundles.reduce((acc, bundle) => {
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
    console.log(`   Expected unique bundles: ${expectedBundles.length}`);

    // 2. Read the actual build output
    console.log("\n2. Reading build output...");
    const buildOutput = fs.readFileSync('./out/index.html', 'utf8');

    // Extract the bundles data from the build output - it's in the push data
    const bundlesMatch = buildOutput.match(/"options":\[({.*?})\]/s);
    if (!bundlesMatch) {
      console.error("Could not find bundles data in build output");
      return;
    }

    // Parse the bundles array from the script
    const bundlesStart = buildOutput.indexOf('"options":[') + '"options":['.length;
    const bundlesEnd = buildOutput.indexOf(']}]', bundlesStart) + 1;
    const bundlesJsonStr = buildOutput.substring(bundlesStart, bundlesEnd);
    const actualBundles = JSON.parse(bundlesJsonStr);
    console.log(`   Actual bundles in build: ${actualBundles.length}`);

    // 3. Find missing bundles
    console.log("\n3. Comparing expected vs actual...");

    const actualBundleSet = new Set(actualBundles.map(b => b.id));
    const missing = expectedBundles.filter(b => !actualBundleSet.has(b.id));

    if (missing.length > 0) {
      console.log(`\n❌ MISSING BUNDLES (${missing.length}):`);
      missing.forEach((bundle, i) => {
        console.log(`   ${i+1}. ${bundle.name}`);
        console.log(`      ID: ${bundle.id}`);
        console.log(`      OCA Bundle: ${bundle.ocabundle}`);
        console.log(`      Org: ${bundle.org || 'N/A'}`);
        console.log(`      IDs: [${bundle.ids.join(', ')}]`);
        console.log("");
      });
    } else {
      console.log("✅ No missing bundles found");
    }

    // 4. Double-check by comparing the other way
    console.log("4. Checking for unexpected bundles in actual output...");
    const expectedBundleSet = new Set(expectedBundles.map(b => b.id));
    const unexpected = actualBundles.filter(b => !expectedBundleSet.has(b.id));

    if (unexpected.length > 0) {
      console.log(`\n⚠️ UNEXPECTED BUNDLES (${unexpected.length}):`);
      unexpected.forEach((bundle, i) => {
        console.log(`   ${i+1}. ${bundle.name} (${bundle.id})`);
      });
    } else {
      console.log("✅ No unexpected bundles found");
    }

    // 5. Summary
    console.log("\n=== SUMMARY ===");
    console.log(`Expected: ${expectedBundles.length} bundles`);
    console.log(`Actual: ${actualBundles.length} bundles`);
    console.log(`Missing: ${missing.length} bundles`);
    console.log(`Unexpected: ${unexpected.length} bundles`);

  } catch (error) {
    console.error('Error:', error);
  }
}

identifyMissingBundles();