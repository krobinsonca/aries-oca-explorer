import { OverlayBundle } from "@hyperledger/aries-oca";
import { parse } from 'csv-parse/browser/esm/sync';

class OverlayBundleFactory {
  public static async fetchRawOverlayBundle(
    url: string
  ): Promise<any> {
    const response = await fetch(url);
    return await response.json();
  }

  public static async fetchOverlayBundle(
    credentialDefinitionId: string,
    url: string
  ): Promise<OverlayBundle> {
    const data = await this.fetchRawOverlayBundle(url);
    return this.createOverlayBundle(credentialDefinitionId, data[0]);
  }

  public static async fetchOverlayBundleData(
    url: string
  ): Promise<Record<string, string>> {
    try {
      // Most bundles don't have testdata.csv, so we'll be more selective
      // Only attempt to fetch for bundles that are likely to have test data
      const testDataUrl = url.replace("OCABundle.json", "testdata.csv");

      // Skip HEAD request to avoid 404 console noise
      // Instead, try a direct fetch with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      try {
        const response = await fetch(testDataUrl, {
          signal: controller.signal,
          // Add cache control to avoid repeated requests
          cache: "no-cache"
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          // File doesn't exist or other error, return empty object silently
          return {};
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/csv")) {
          // If content-type doesn't indicate CSV, don't try to parse it
          return {};
        }

        const csv: string = await response.text();

        // Basic validation - ensure we have some CSV-like content
        if (!csv.trim() || !csv.includes(',')) {
          return {};
        }

        const data = parse(csv, { 
          delimiter: ", ", 
          columns: true,
          // Skip empty lines and handle malformed CSV gracefully
          skip_empty_lines: true,
          relax_column_count: true
        });
        
        return data[0] ?? ({} as Record<string, string>);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If it's an abort error (timeout) or 404, just return empty object
        if (fetchError instanceof Error && (
          fetchError.name === 'AbortError' || 
          fetchError.message.includes('fetch') ||
          fetchError.message.includes('network')
        )) {
          return {};
        }
        
        // Re-throw unexpected errors
        throw fetchError;
      }

    } catch (error) {
      // Silently handle any errors - testdata.csv files are optional
      // Only log unexpected errors that aren't network-related
      // Silence unexpected network/parse noise in UI; leave for debugging only
      // console.warn('Unexpected error in fetchOverlayBundleData:', error);
      return {};
    }
  }

  public static createOverlayBundle(
    id: string,
    data: any
  ): OverlayBundle {
    return new OverlayBundle(id, data);
  }
}

export default OverlayBundleFactory;