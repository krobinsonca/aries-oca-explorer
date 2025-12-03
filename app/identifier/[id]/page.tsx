import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // Fetch ALL credential IDs from the API during build to generate static pages
  // This ensures all credential detail pages exist for GitHub Pages static export
  const allIds = new Set<string>();

  try {
    const bundles = await fetchOverlayBundleList();

    // Extract all unique credential IDs from all bundles and add to set
    bundles.forEach(bundle => {
      bundle.ids.forEach(id => allIds.add(id));
    });
  } catch (error) {
    // Fail the build if API fetch fails - we need all IDs for static generation
    // With output: 'export', we can't generate pages at runtime
    console.error('generateStaticParams: Failed to fetch from API:', error);
    throw new Error(`Failed to fetch bundle list during static generation: ${error instanceof Error ? error.message : 'Unknown error'}. This will cause 404s for all credential detail pages.`);
  }

  // Encode IDs to prevent Next.js from treating / as path separator during static export
  // This matches the encoding used in EnhancedCredentialFilter navigation
  const staticIds = Array.from(allIds).map((id) => ({
    id: encodeURIComponent(id)
  }));

  console.log(`generateStaticParams: Generated ${staticIds.length} static pages for credential identifiers`);
  return staticIds;
}

// With output: 'export', we must pre-generate all pages at build time
// Force static generation to prevent deopt into client-side rendering
export const dynamic = 'force-static';
export const dynamicParams = false;

export default async function Page({ params }: { params: { id: string } }) {
  // Decode the ID - it was encoded in generateStaticParams to prevent path issues
  let id: string;
  try {
    id = decodeURIComponent(params.id);
  } catch (e) {
    // If decoding fails, log and return 404
    console.error('Failed to decode ID:', params.id, e);
    notFound();
    return;
  }

  try {
    // Use the same data fetching logic as generateStaticParams to ensure consistency
    const bundles = await fetchOverlayBundleList();

    // Try to find the bundle by checking both the ids array and the individual bundle id
    const option = bundles.find((bundle) => {
      // Check if the decoded ID matches any ID in the bundle's ids array
      return bundle.ids.includes(id);
    });

    if (!option) {
      // Log detailed info for debugging during static generation
      // This helps identify why IDs from generateStaticParams aren't found during rendering
      const allIds = bundles.flatMap(b => b.ids);
      const foundSimilar = allIds.filter(bundleId => {
        // Check if IDs are similar (same credential definition or schema)
        const idParts = id.split(':');
        const bundleIdParts = bundleId.split(':');
        return idParts.length === bundleIdParts.length &&
               idParts.slice(0, -1).join(':') === bundleIdParts.slice(0, -1).join(':');
      }).slice(0, 3);

      console.error(`Page component: Could not find bundle for ID: ${id} (encoded: ${params.id})`);
      console.error(`Total bundles available: ${bundles.length}`);
      console.error(`Total IDs across all bundles: ${allIds.length}`);
      if (foundSimilar.length > 0) {
        console.error(`Similar IDs found: ${foundSimilar.join(', ')}`);
      }
      notFound();
    }

    return (
      <OverlayBundleView option={option} />
    );
  } catch (error) {
    console.error('Error fetching bundle data:', error);
    // Check if this might be a network issue vs a missing bundle
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error('Network error during bundle fetch, this might be a temporary issue');
    }
    notFound();
  }
}