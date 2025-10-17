'use client';

import { useEffect, useState } from 'react';
import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleList, BundleWithLedger } from "@/app/lib/data";
import { CircularProgress, Box, Typography } from '@mui/material';

// Helper function to encode credential ID for use as filename
// Use base64 encoding to avoid issues with special characters in GitHub Pages
function encodeIdForFilename(id: string): string {
  // Use browser-compatible base64 encoding (same as btoa)
  const encoded = Buffer.from(id, 'utf8').toString('base64');
  // Make it URL-safe by replacing + with - and / with _
  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to decode filename back to credential ID
function decodeIdFromFilename(encodedId: string): string {
  try {
    // Reverse the URL-safe base64 encoding
    const base64 = encodedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Failed to decode ID:', encodedId, e);
    // If decoding fails, return as is
    return encodedId;
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const [option, setOption] = useState<BundleWithLedger | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOption() {
      try {
        const id = decodeIdFromFilename(params.id);
        const options: BundleWithLedger[] = await fetchOverlayBundleList();
        const foundOption = options.find((opt) => opt.id === id);

        if (!foundOption) {
          setError(`Credential not found: ${id}`);
        } else {
          setOption(foundOption);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load credential details');
      } finally {
        setIsLoading(false);
      }
    }

    loadOption();
  }, [params.id]);

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <CircularProgress size={50} />
        <Typography variant="body1">Loading credential details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <Typography variant="h6" color="error">Error loading credential</Typography>
        <Typography variant="body2" color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  if (!option) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <Typography variant="h6" color="error">Credential not found</Typography>
        <Typography variant="body2" color="text.secondary">The requested credential could not be found.</Typography>
      </Box>
    );
  }

  return (
    <OverlayBundleView option={option} />
  );
}