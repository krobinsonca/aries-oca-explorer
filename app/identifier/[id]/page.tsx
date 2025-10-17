import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList } from "@/app/lib/data";
import { notFound } from "next/navigation";

// Helper function to encode credential ID for use as filename
// Use base64 encoding to avoid issues with special characters in GitHub Pages
function encodeIdForFilename(id: string): string {
  // Use browser-compatible base64 encoding (same as btoa)
  const encoded = Buffer.from(id, 'utf8').toString('base64');
  // Make it URL-safe by replacing + with - and / with _
  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to decode filename back to credential ID
function decodeIdFromFilename(encodedId: string): string {
  try {
    // Reverse the URL-safe base64 encoding
    const base64 = encodedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Failed to decode ID:', encodedId, e);
    // If decoding fails, return as is
    return encodedId;
  }
}

export async function generateStaticParams() {
  const options: any[] = await fetchOverlayBundleList();
  return options.map((option) => ({
    id: encodeIdForFilename(option.id)
  }));
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = decodeIdFromFilename(params.id);
  const options: any[] = await fetchOverlayBundleList();
  const option = options.find((option) => option.id === id);

  if (!option) {
    notFound();
  }

  return (
    <OverlayBundleView option={option} />
  );
}