import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

// Pre-defined list of known credential IDs for static generation
const KNOWN_CREDENTIAL_IDS = [
  // Real credential IDs from the API (updated to match actual data)
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
];

export async function generateStaticParams() {
  // For static generation, we'll use a conservative approach
  // that prioritizes build stability over live data fetching

  // In production builds, we'll primarily use known IDs to avoid network issues
  // The app will still fetch live data at runtime for better UX
  console.log('generateStaticParams: Using known credential IDs for static generation');

  // Use the known IDs as the primary source for static generation
  // This ensures the build doesn't fail due to network issues
  const staticIds = KNOWN_CREDENTIAL_IDS.map((id) => ({
    id: encodeURIComponent(id)
  }));

  // Optionally try to fetch additional IDs, but don't let it break the build
  try {
    const bundles = await fetchOverlayBundleList();
    if (bundles.length > 0) {
      const allIds = bundles.flatMap(bundle => bundle.ids);
      console.log(`generateStaticParams: Also found ${allIds.length} live IDs`);

      // Add any additional IDs that aren't already in our known list
      const additionalIds = allIds.filter(id => !KNOWN_CREDENTIAL_IDS.includes(id));
      const additionalStaticIds = additionalIds.map((id) => ({
        id: encodeURIComponent(id)
      }));

      console.log(`generateStaticParams: Adding ${additionalStaticIds.length} additional IDs from live data`);
      return [...staticIds, ...additionalStaticIds];
    }
  } catch (error) {
    console.warn('generateStaticParams: Failed to fetch live data, using known IDs only:', error);
  }

  return staticIds;
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  try {
    // Use the same data fetching logic as generateStaticParams to ensure consistency
    const bundles = await fetchOverlayBundleList();
    const option = bundles.find((bundle) => bundle.ids.includes(id));

    if (!option) {
      console.warn(`Bundle not found for ID: ${id}`);
      notFound();
    }

    return (
      <OverlayBundleView option={option} />
    );
  } catch (error) {
    console.error('Error fetching bundle data:', error);
    // Don't immediately call notFound() - let's try to be more graceful
    // Check if this might be a network issue vs a missing bundle
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error('Network error during bundle fetch, this might be a temporary issue');
    }
    notFound();
  }
}