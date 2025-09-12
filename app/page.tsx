'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import EnhancedCredentialFilter from '@/app/components/EnhancedCredentialFilter';
import { fetchOverlayBundleList, BundleWithLedger } from '@/app/lib/data';
import { CircularProgress, Box, Typography } from '@mui/material';

export default function Page() {
  const [options, setOptions] = useState<BundleWithLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await fetchOverlayBundleList();
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bundle list');
      } finally {
        setIsLoading(false);
      }
    }

    loadOptions();
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <CircularProgress size={50} />
        <Typography variant="body1">Loading credential bundles...</Typography>
      </Box>
    );
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
