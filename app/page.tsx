import Header from '@/app/components/Header';
import OverlayBundleForm from '@/app/components/OverlayBundleForm';
import { fetchOverlayBundleList } from '@/app/lib/data';

export default async function Page() {
  const options = await fetchOverlayBundleList();

  return (
    <>
      <Header />
      <main className='app min-h-screen'>
        <OverlayBundleForm options={options} />
      </main>
    </>
  );
}
