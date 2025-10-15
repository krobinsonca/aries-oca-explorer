import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // Simplified fetch for static generation - only get IDs, skip ledger info
  try {
    console.log('generateStaticParams: Starting bundle list fetch...');
    const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(`Failed to fetch bundle list for static generation: ${response.status}`);
      // Return a fallback set of common credential IDs to ensure some pages are generated
      return [
        { id: encodeURIComponent('4WW6792ksq62UroZyfd6nQ:3:CL:1098:SpecialEventServer:1') },
        { id: encodeURIComponent('RGjWbW1eycP7FrMf4QJvX8:3:CL:13:Person') }
      ];
    }

    const options: any[] = await response.json();
    console.log(`generateStaticParams: Processing ${options.length} bundles`);

    if (options.length === 0) {
      console.warn('generateStaticParams: No bundles found, returning fallback IDs');
      return [
        { id: encodeURIComponent('4WW6792ksq62UroZyfd6nQ:3:CL:1098:SpecialEventServer:1') },
        { id: encodeURIComponent('RGjWbW1eycP7FrMf4QJvX8:3:CL:13:Person') }
      ];
    }

    return options.map((option) => ({
      id: encodeURIComponent(option.id)
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    // Return fallback IDs to ensure some pages are generated even if fetch fails
    console.log('generateStaticParams: Using fallback IDs due to error');
    return [
      { id: encodeURIComponent('4WW6792ksq62UroZyfd6nQ:3:CL:1098:SpecialEventServer:1') },
      { id: encodeURIComponent('RGjWbW1eycP7FrMf4QJvX8:3:CL:13:Person') }
    ];
  }
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