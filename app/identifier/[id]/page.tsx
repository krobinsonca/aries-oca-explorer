import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList } from "@/app/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const options: any[] = await fetchOverlayBundleList();
  // Encode IDs to make them filesystem-safe using base64url encoding
  const params = options.map((option) => ({
    id: Buffer.from(option.id, 'utf8').toString('base64url')
  }));
  return params;
}

export default async function Page({ params }: { params: { id: string } }) {
  // Decode the base64url encoded ID back to the original ID
  const id = Buffer.from(params.id, 'base64url').toString('utf8');
  const options: any[] = await fetchOverlayBundleList();
  const option = options.find((option) => option.id === id);

  if (!option) {
    notFound();
  }

  return (
    <OverlayBundleView option={option} />
  );
}