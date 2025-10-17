import { fetchOverlayBundleList, BundleWithLedger } from '@/app/lib/data';
import { Box, Typography, Paper } from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import the client component to prevent SSR/SSG deoptimization
const EnhancedCredentialFilter = dynamic(
  () => import('@/app/components/EnhancedCredentialFilter'),
  {
    ssr: false,
    loading: () => (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Loading credential explorer...</Typography>
      </Paper>
    )
  }
);

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
    <Box>
      {/* Static content for SSG */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          OCA Bundle Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Explore and filter through {options.length} available credential bundles.
          Search by name or description, or filter by ledger network.
        </Typography>
      </Paper>

      {/* Client-side interactive component loaded dynamically */}
      <EnhancedCredentialFilter options={options} />
    </Box>
  );
}
