import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

// Pre-defined list of known credential IDs for static generation
const KNOWN_CREDENTIAL_IDS = [
  // From the failing URLs you reported
  '4WW6792ksq62UroZyfd6nQ:3:CL:1098:SpecialEventServer:1',
  'RGjWbW1eycP7FrMf4QJvX8:3:CL:13:Person',
  // Real credential IDs from the API
  'YWnESLB4SH275SMNvaJJ1L:2:Rental Property Business Licence:1.0',
  'YWnESLB4SH275SMNvaJJ1L:3:CL:38195:Rental Property Business Licence',
  'R12pguaP3VF2WiE6vAsiPF:2:Rental Property Business Licence:1.0',
  'R12pguaP3VF2WiE6vAsiPF:3:CL:4574:Rental Property Business Licence',
  'ARK5s3QZtjL5X65mLoubdk:2:Rental Property Business Licence:1.0',
];

export async function generateStaticParams() {
  console.log('generateStaticParams: Starting static generation...');

  try {
    // First try to fetch from API
    console.log('generateStaticParams: Attempting to fetch bundle list...');
    const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`, {
      signal: AbortSignal.timeout(15000), // Reduced timeout
    });

    if (response.ok) {
      const options: any[] = await response.json();
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
    // Fetch simple bundle list without ledger info to avoid timeout during static generation
    const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    if (!response.ok) {
      console.error(`Failed to fetch bundle list for page: ${response.status}`);
      notFound();
    }

    const options: any[] = await response.json();
    const option = options.find((opt: any) => opt.id === id);

    if (!option) {
      console.error(`Bundle not found for ID: ${id}`);
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