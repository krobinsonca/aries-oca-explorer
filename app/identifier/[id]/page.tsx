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
  console.log('generateStaticParams: Starting static generation...');
  // Trigger new build to test credential detail pages

  try {
    // First try to fetch from API
    console.log('generateStaticParams: Attempting to fetch bundle list...');
    const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`, {
      signal: AbortSignal.timeout(15000), // Reduced timeout
    });

        if (response.ok) {
          const responseData = await response.json();
          // Handle both array and object with 'value' property structures
          const options: any[] = Array.isArray(responseData) ? responseData : (responseData.value || responseData);
          console.log(`generateStaticParams: Successfully fetched ${options.length} bundles from API`);

      if (options.length > 0) {
        // Combine API results with known IDs to ensure coverage
        const apiIds = options.map((option) => option.id);
        const allIdsSet = new Set([...KNOWN_CREDENTIAL_IDS, ...apiIds]);
        const allIds = Array.from(allIdsSet);
        console.log(`generateStaticParams: Generating ${allIds.length} total pages`);

        return allIds.map((id) => ({
          id: encodeURIComponent(id)
        }));
      }
    }

    console.warn('generateStaticParams: API fetch failed or returned empty, using known IDs');
  } catch (error) {
    console.error('generateStaticParams: API fetch error:', error);
  }

  // Fallback to known IDs
  console.log(`generateStaticParams: Using ${KNOWN_CREDENTIAL_IDS.length} known credential IDs`);
  return KNOWN_CREDENTIAL_IDS.map((id) => ({
    id: encodeURIComponent(id)
  }));
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  try {
    // Use the same data fetching logic as generateStaticParams to ensure consistency
    const bundles = await fetchOverlayBundleList();
    console.log(`Looking for ID: ${id}`);
    console.log(`Available bundles: ${bundles.length}`);
    console.log(`First bundle IDs: ${bundles[0]?.ids?.join(', ')}`);
    
    const option = bundles.find((bundle) => bundle.ids.includes(id));

    if (!option) {
      console.error(`Bundle not found for ID: ${id}`);
      console.error(`Available IDs: ${bundles.map(b => b.ids.join(', ')).join(' | ')}`);
      notFound();
    }

    return (
      <OverlayBundleView option={option} />
    );
  } catch (error) {
    console.error('Error fetching bundle data:', error);
    notFound();
  }
}