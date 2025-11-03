import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

// Pre-defined list of known credential IDs as fallback
// These are kept as a safety net if API fetch fails during build
const FALLBACK_CREDENTIAL_IDS = [
  '4WW6792ksq62UroZyfd6nQ:3:CL:1098:SpecialEventServer',
  'YWnESLB4SH275SMNvaJJ1L:2:Rental Property Business Licence:1.0',
  'YWnESLB4SH275SMNvaJJ1L:3:CL:38195:Rental Property Business Licence',
  'R12pguaP3VF2WiE6vAsiPF:2:Rental Property Business Licence:1.0',
  'R12pguaP3VF2WiE6vAsiPF:3:CL:4574:Rental Property Business Licence',
  'ARK5s3QZtjL5X65mLoubdk:2:Rental Property Business Licence:1.0',
  '4WW6792ksq62UroZyfd6nQ:3:CL:1098:SellingItRight',
  'TeT8SJGHruVL9up3Erp4o:3:CL:224665:Selling It Right',
  'TeT8SJGHruVL9up3Erp4o:3:CL:400095:SellingItRight',
  'Ttmj1pEotg8FbKZZD81S7i:3:CL:184:SellingItRight',
  '4WW6792ksq62UroZyfd6nQ:3:CL:1098:ServingItRight',
  'TeT8SJGHruVL9up3Erp4o:3:CL:224665:Serving It Right',
  'TeT8SJGHruVL9up3Erp4o:3:CL:400095:ServingItRight',
  'Ttmj1pEotg8FbKZZD81S7i:3:CL:184:ServingItRight',
  'TeT8SJGHruVL9up3Erp4o:3:CL:224665:Special Event Server',
  'TeT8SJGHruVL9up3Erp4o:3:CL:400095:SpecialEventServer',
  'Ttmj1pEotg8FbKZZD81S7i:3:CL:184:SpecialEventServer',
  'QzLYGuAebsy3MXQ6b1sFiT:3:CL:2351:lawyer',
  'RCnz8GcyZ2iH7VFr5zGb9N:3:CL:35170:Lawyer Credential',
  'RGjWbW1eycP7FrMf4QJvX8:3:CL:13:Person',
];

export async function generateStaticParams() {
  // Fetch ALL credential IDs from the API during build to generate static pages
  // This ensures all credential detail pages exist for GitHub Pages static export

  console.log('generateStaticParams: Fetching credential IDs from API for static generation');

  try {
    const bundles = await fetchOverlayBundleList();

    // Extract all unique credential IDs from all bundles
    const allIds = new Set<string>();
    bundles.forEach(bundle => {
      bundle.ids.forEach(id => allIds.add(id));
    });

    // Return raw IDs - Next.js will handle URL encoding automatically
    // This matches Next.js best practices for generateStaticParams
    const staticIds = Array.from(allIds).map((id) => ({
      id: id
    }));

    console.log(`generateStaticParams: Generating ${staticIds.length} static pages from API data`);
    return staticIds;
  } catch (error) {
    console.warn('generateStaticParams: Failed to fetch from API, using fallback IDs:', error);
    // Fallback to known IDs if API fetch fails during build
    // Return raw IDs - Next.js will handle URL encoding automatically
    const staticIds = FALLBACK_CREDENTIAL_IDS.map((id) => ({
      id: id
    }));
    console.log(`generateStaticParams: Using ${staticIds.length} fallback credential IDs`);
    return staticIds;
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  // Next.js automatically decodes URL-encoded params
  // The id should already be decoded, but handle edge cases
  let id = params.id;

  // Decode if still encoded (shouldn't happen, but safety check)
  if (id.includes('%')) {
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      // If decode fails, use as-is
      console.warn('Failed to decode ID:', id);
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
      console.warn(`Bundle not found for ID: ${params.id} (decoded: ${id})`);
      // Log available IDs for debugging
      const availableIds = bundles.flatMap(b => b.ids).slice(0, 5);
      console.warn(`Available IDs (first 5): ${availableIds.join(', ')}`);
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