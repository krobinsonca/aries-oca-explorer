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
  try {
    // Use the same data fetching logic as the Page component to ensure consistency
    const bundles = await fetchOverlayBundleList();

    if (bundles.length > 0) {
      // Extract all IDs from the grouped bundles
      const allIds = bundles.flatMap(bundle => bundle.ids);
      
      // Combine with known IDs to ensure coverage
      const allIdsSet = new Set([...KNOWN_CREDENTIAL_IDS, ...allIds]);
      const uniqueIds = Array.from(allIdsSet);

      return uniqueIds.map((id) => ({
        id: id
      }));
    }
  } catch (error) {
    console.error('generateStaticParams: Error fetching bundles:', error);
  }

  // Fallback to known IDs
  return KNOWN_CREDENTIAL_IDS.map((id) => ({
    id: id
  }));
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  try {
    // Use the same data fetching logic as generateStaticParams to ensure consistency
    const bundles = await fetchOverlayBundleList();
    const option = bundles.find((bundle) => bundle.ids.includes(id));

    if (!option) {
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