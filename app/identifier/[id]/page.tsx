import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BUNDLE_LIST_URL, BUNDLE_LIST_FILE } from "@/app/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // Simplified fetch for static generation - only get IDs, skip ledger info
  try {
    const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(`Failed to fetch bundle list for static generation: ${response.status}`);
      return [];
    }

    const options: any[] = await response.json();
    console.log(`generateStaticParams: Processing ${options.length} bundles`);

    return options.map((option) => ({
      id: encodeURIComponent(option.id)
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return []; // Return empty array on error to prevent build failure
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  // Fetch simple bundle list without ledger info to avoid timeout during static generation
  const response = await fetch(`${BUNDLE_LIST_URL}/${BUNDLE_LIST_FILE}`);
  if (!response.ok) {
    notFound();
  }

  const options: any[] = await response.json();
  const option = options.find((opt: any) => opt.id === id);

  if (!option) {
    notFound();
  }

  return (
    <OverlayBundleView option={option} />
  );
}