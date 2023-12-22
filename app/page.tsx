import OverlayBundleForm from './components/OverlayBundleForm';
import { fetchOverlayBundleList } from './lib/data';

export default async function Page() {
  const options = await fetchOverlayBundleList();

  return <OverlayBundleForm options={options} />;
}
