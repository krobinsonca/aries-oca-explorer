import OverlayBundleFactory from "@/app/services/OverlayBundleFactory";

export const BUNDLE_LIST_URL = "https://bcgov.github.io/aries-oca-bundles";
export const BUNDLE_LIST_FILE = "ocabundleslist.json";

export async function fetchOverlayBundleList() {
  try {
    const response = await fetch(BUNDLE_LIST_URL + "/" + BUNDLE_LIST_FILE);

    const body = await response.text();

    const options: any[] = JSON.parse(body);
    return options;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch Overlay Bundle List.');
  }
}

export async function fetchOverlayBundleData(option: any) {
  try {
    option.url = BUNDLE_LIST_URL + "/" + option.ocabundle;

    const [overlay, data] = await Promise.all([
      OverlayBundleFactory.fetchOverlayBundle(option.id, option.url),
      OverlayBundleFactory.fetchOverlayBundleData(option.url)
    ]);
    return { overlay, data };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch Overlay Bundle Data.');
  }
}