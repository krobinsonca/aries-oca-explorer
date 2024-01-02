import { KeyboardReturnOutlined } from "@mui/icons-material";
import OverlayBundleFactory from "@/app/services/OverlayBundleFactory";

export const BUNDLE_LIST_URL = "https://raw.githubusercontent.com/bcgov/aries-oca-bundles/main";
export const BUNDLE_LIST_PATH = "/ocabundleslist.json";

export async function fetchOverlayBundleList() {
  try {
    const response = await fetch(BUNDLE_LIST_URL + BUNDLE_LIST_PATH, {
      headers: { "Content-Type": "text/plain" }
    });

    const body = await response.text();
    body.replaceAll("\n", "");
    body.replace(/,\]$/, "]");

    const options = JSON.parse(body);
    return Object.entries(options.reduce((opts: any, option: any) => {
      opts[option.ocabundle] = option;
      return opts;
    }, {})).map(entry => entry[1]);
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