import { fetchOverlayBundleList, BundleWithLedger } from '@/app/lib/data';
import EnhancedCredentialFilter from '@/app/components/EnhancedCredentialFilter';
import { Box, Typography } from '@mui/material';

// Generate static page with pre-fetched data
export default async function Page() {
  let options: BundleWithLedger[] = [];
  let error: string | null = null;

  try {
    options = await fetchOverlayBundleList();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load bundle list';
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <Typography variant="h6" color="error">Error loading bundles</Typography>
        <Typography variant="body2" color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  return (
    <EnhancedCredentialFilter options={options} />
  );
}
