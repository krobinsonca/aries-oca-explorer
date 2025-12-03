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

  // Encode IDs to match Next.js URL encoding behavior
  // Next.js encodes special characters (including colons and slashes) in dynamic route params
  // We need to match that encoding format for generateStaticParams to work correctly
  const staticIds = Array.from(allIds).map((id) => ({
    id: encodeURIComponent(id)
  }));

  console.log(`generateStaticParams: Generated ${staticIds.length} static pages for credential identifiers`);
  return staticIds;
}

export const dynamicParams = true;

export default async function Page({ params }: { params: { id: string } }) {
  // Decode the ID - Next.js encodes it when processing the route parameter
  // Use decodeURIComponent to properly decode all encoded characters (%2F, %3A, etc.)
  let id = params.id;

  // Always try to decode - Next.js will encode the ID in the URL
  try {
    id = decodeURIComponent(id);
  } catch (e) {
    // If decoding fails, try manual decoding of just slashes (fallback)
    if (id.includes('%2F')) {
      id = id.replace(/%2F/g, '/');
    }
    // Also try to decode colons if they're encoded
    if (id.includes('%3A')) {
      id = id.replace(/%3A/g, ':');
    }
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