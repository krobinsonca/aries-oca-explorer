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

  // Start with fallback IDs to ensure known IDs are always included
  const allIds = new Set<string>(FALLBACK_CREDENTIAL_IDS);

  try {
    const bundles = await fetchOverlayBundleList();

    // Extract all unique credential IDs from all bundles and add to set
    bundles.forEach(bundle => {
      bundle.ids.forEach(id => allIds.add(id));
    });
  } catch (error) {
    console.warn('generateStaticParams: Failed to fetch from API, using fallback IDs only:', error);
  }

  // Encode IDs to match Next.js URL encoding behavior
  // Next.js encodes special characters (including colons and slashes) in dynamic route params
  // We need to match that encoding format for generateStaticParams to work correctly
  const staticIds = Array.from(allIds).map((id) => ({
    id: encodeURIComponent(id)
  }));

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