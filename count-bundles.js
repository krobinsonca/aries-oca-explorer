// Count bundles from the static build output
const fs = require('fs');

async function countBundles() {
  try {
    console.log("=== Counting Bundles in Static Build ===\n");

    // Read the build output
    const buildOutput = fs.readFileSync('./out/index.html', 'utf8');

    // The bundle data is in the script section, let's extract it more carefully
    // Looking for the "options" array in the bundle data
    const startMarker = '"options":[';
    const startIndex = buildOutput.indexOf(startMarker);

    if (startIndex === -1) {
      console.error("Could not find options array");
      return;
    }

    // Find the end of the options array by counting brackets
    let bracketCount = 0;
    let currentIndex = startIndex + startMarker.length;
    let endIndex = -1;

    for (let i = currentIndex; i < buildOutput.length; i++) {
      const char = buildOutput[i];
      if (char === '[') bracketCount++;
      else if (char === ']') {
        bracketCount--;
        if (bracketCount === -1) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) {
      console.error("Could not find end of options array");
      return;
    }

    // Extract the bundles JSON
    const bundlesJson = buildOutput.substring(startIndex + startMarker.length, endIndex);
    const bundles = JSON.parse(bundlesJson);

    console.log(`Total bundles in static build: ${bundles.length}`);

    // List all bundles with their IDs and names
    console.log("\nAll bundles:");
    bundles.forEach((bundle, i) => {
      console.log(`   ${i+1}. ${bundle.name} (${bundle.id})`);
      console.log(`      Ledger: ${bundle.ledgerDisplayName || 'N/A'}`);
      console.log(`      OCA Bundle: ${bundle.ocabundle}`);
      console.log("");
    });

    // Count by ledger
    const ledgerCounts = {};
    bundles.forEach(bundle => {
      const ledger = bundle.ledgerNormalized || 'no-ledger';
      ledgerCounts[ledger] = (ledgerCounts[ledger] || 0) + 1;
    });

    console.log("Bundle count by ledger:");
    Object.entries(ledgerCounts).sort().forEach(([ledger, count]) => {
      console.log(`   ${ledger}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

countBundles();