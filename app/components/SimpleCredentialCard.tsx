'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { OverlayBundle } from '@hyperledger/aries-oca';
import { CredentialExchangeRecord } from '@aries-framework/core';
import { fetchOverlayBundleData } from '@/app/lib/data';
import CredentialCard from './CredentialCard';
import { BundleWithLedger } from '@/app/lib/data';
import { useBrandingDispatch, ActionType } from '@/app/contexts/Branding';

interface SimpleCredentialCardProps {
  bundle: BundleWithLedger;
  onClick: () => void;
  language?: string;
}

// Helper function to create a mock credential record from overlay data
function createMockCredentialRecord(overlay: OverlayBundle, bundle: BundleWithLedger): any {
  // Create mock attributes based on the overlay's capture base
  const mockAttributes: Record<string, string> = {};
  
  if (overlay.captureBase?.attributes && Array.isArray(overlay.captureBase.attributes)) {
    overlay.captureBase.attributes.forEach((attr: any) => {
      // Use placeholder values for demo purposes
      mockAttributes[attr.name] = `Sample ${attr.name}`;
    });
  }

  // Create a minimal mock credential record
  const mockRecord = {
    id: `mock-${bundle.id}`,
    type: 'CredentialExchangeRecord' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    state: 'credential-issued' as const,
    connectionId: 'mock-connection',
    threadId: `mock-thread-${bundle.id}`,
    protocolVersion: 'v2',
    credentials: [{
      credentialRecordType: 'indy',
      credentialRecordId: `mock-cred-${bundle.id}`,
    }],
    credentialAttributes: Object.entries(mockAttributes).map(([name, value]) => ({
      name,
      value,
      mimeType: 'text/plain',
    })),
    // Add other required fields with mock values
    autoAcceptCredential: 'never',
    errorMessage: undefined,
    revocationNotification: undefined,
    tags: {},
    metadata: {},
  };

  return mockRecord;
}

export default function SimpleCredentialCard({ bundle, onClick, language = 'en' }: SimpleCredentialCardProps) {
  const [overlay, setOverlay] = useState<OverlayBundle | null>(null);
  const [mockRecord, setMockRecord] = useState<CredentialExchangeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const brandingDispatch = useBrandingDispatch();

  useEffect(() => {
    let isMounted = true;

    const loadOverlay = async () => {
      try {
        console.log('Loading overlay for bundle:', bundle.id);
        setIsLoading(true);
        setError(null);

        const result = await fetchOverlayBundleData(bundle, { includeTestData: false });
        console.log('Fetch result:', result);
        
        if (!isMounted) return;

        if (result && result.overlay) {
          console.log('Setting overlay:', result.overlay);
          console.log('SimpleCredentialCard - Overlay branding:', result.overlay?.branding);
          console.log('SimpleCredentialCard - Overlay overlays:', result.overlay?.overlays);
          setOverlay(result.overlay);
          // Create mock credential record for rendering
          const mock = createMockCredentialRecord(result.overlay, bundle);
          setMockRecord(mock);
        } else {
          console.log('No overlay in result');
          setError('No overlay data');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading overlay:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOverlay();

    return () => {
      isMounted = false;
    };
  }, [bundle.id]);

  // Initialize branding when overlay is loaded
  useEffect(() => {
    if (!brandingDispatch || !overlay) {
      console.log('SimpleCredentialCard - No branding dispatch or overlay:', { brandingDispatch: !!brandingDispatch, overlay: !!overlay });
      return;
    }

    console.log('SimpleCredentialCard - Initializing branding with overlay:', overlay);
    console.log('SimpleCredentialCard - Overlay has branding:', !!overlay?.branding);

    const extractWatermarkText = (ov: any): string => {
      const cands: any[] = [
        ov?.branding?.watermarkText,
        ov?.branding?.watermark,
        ov?.branding?.water_mark,
        ov?.metadata?.watermarkText,
        ov?.metadata?.watermark?.text,
        ov?.metadata?.watermark,
        ov?.watermarkText,
        ov?.watermark?.text,
        ov?.watermark,
      ];
      for (const cand of cands) {
        if (cand === undefined || cand === null) continue;
        if (typeof cand === 'string' && cand.trim()) return cand;
        if (Array.isArray(cand) && cand.length && cand.every(x => typeof x === 'string')) {
          return (cand as string[]).join(' ');
        }
        if (typeof cand === 'object') {
          if (typeof (cand as any).text === 'string' && (cand as any).text.trim()) return (cand as any).text;
          const values = Object.values(cand as Record<string, unknown>);
          const first = values.find(v => typeof v === 'string' && (v as string).trim());
          if (typeof first === 'string') return first as string;
        }
      }
      return '';
    };

    const resolvedWatermark = extractWatermarkText(overlay);

    // Use overlay branding if available, otherwise use defaults
    const brandingPayload = {
      logo: overlay.branding?.logo ?? "",
      backgroundImage: overlay.branding?.backgroundImage ?? "",
      backgroundImageSlice: overlay.branding?.backgroundImageSlice ?? "",
      primaryBackgroundColor: overlay.branding?.primaryBackgroundColor ?? "#003366",
      secondaryBackgroundColor: overlay.branding?.secondaryBackgroundColor ?? "#003366",
      primaryAttribute: overlay.branding?.primaryAttribute ?? "",
      secondaryAttribute: overlay.branding?.secondaryAttribute ?? "",
      watermarkText: resolvedWatermark,
    };

    console.log('SimpleCredentialCard - Setting branding payload:', brandingPayload);

    brandingDispatch({
      type: ActionType.SET_BRANDING,
      payload: brandingPayload
    });
  }, [brandingDispatch, overlay]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          p: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading {bundle.name || bundle.id}
        </Typography>
      </Box>
    );
  }

  if (error || !overlay || !mockRecord) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
        sx={{
          border: 1,
          borderColor: 'error.main',
          borderRadius: 1,
          backgroundColor: 'error.light',
          color: 'error.contrastText',
          cursor: 'pointer',
          p: 2,
          '&:hover': {
            backgroundColor: 'error.dark'
          }
        }}
        onClick={onClick}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {bundle.name || bundle.id}
        </Typography>
        <Typography variant="caption">
          {error || 'No overlay data'}
        </Typography>
        {bundle.ledgerDisplayName && (
          <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
            {bundle.ledgerDisplayName}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
      onClick={onClick}
    >
      <Typography variant="caption" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
        {bundle.name || bundle.id}
      </Typography>
      <CredentialCard overlay={overlay} record={mockRecord} language={language} />
    </Box>
  );
}