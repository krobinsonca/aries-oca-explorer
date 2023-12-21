import OverlayBundleForm from './components/OverlayBundleForm';
import { fetchOverlayBundleList } from './lib/data';
import { unstable_noStore as noStore } from 'next/cache';

export default async function Page() {
  noStore();
  const options = await fetchOverlayBundleList();

  return <OverlayBundleForm options={options} />;
}
