'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList } from "@/app/lib/data";

export default function Page() {
  const params = useParams();
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBundle() {
      try {
        setLoading(true);
        setError(null);

        // Decode the ID from URL params
        const id = decodeURIComponent(params.id as string);

        // Fetch the bundle list (this is cached on the client after first load)
        const options = await fetchOverlayBundleList();
        const foundOption = options.find((opt) => opt.id === id);

        if (!foundOption) {
          setError('Bundle not found');
        } else {
          setOption(foundOption);
        }
      } catch (err) {
        console.error('Error loading bundle:', err);
        setError('Failed to load bundle');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadBundle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading credential details...
        </Typography>
      </Box>
    );
  }

  if (error || !option) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography variant="h4" color="error" gutterBottom>
          404 - Bundle Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error || 'The requested credential bundle does not exist.'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          ID: {params.id}
        </Typography>
      </Box>
    );
  }

  return <OverlayBundleView option={option} />;
}