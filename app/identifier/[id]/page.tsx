import Header from "@/app/components/Header";
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList } from "@/app/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const options: any[] = await fetchOverlayBundleList();
  return options.map((option) =>
    ({ id: encodeURIComponent(option.id) }));
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const options: any[] = await fetchOverlayBundleList();
  const option = options.find((option) => option.id === id);

  if (!option) {
    notFound();
  }

  return (
    <OverlayBundleView option={option} />
  );
}