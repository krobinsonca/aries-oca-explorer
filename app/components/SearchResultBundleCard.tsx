'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { OverlayBundle } from '@hyperledger/aries-oca';
import { useBrandingDispatch, ActionType } from '@/app/contexts/Branding';
import { fetchOverlayBundleData } from '@/app/lib/data';
import CredentialCard from './CredentialCard';
import { BundleWithLedger } from '@/app/lib/data';

interface BrandingInitializerProps {
  overlay?: OverlayBundle;
  watermarkText?: string;
  overlayName?: string;
}

function BrandingInitializer({ overlay, watermarkText, overlayName }: BrandingInitializerProps) {
  const brandingDispatch = useBrandingDispatch();

  useEffect(() => {
    if (!brandingDispatch || !overlay?.branding) return;

    const extractWatermarkText = (ov: any): string => {
      const cands = [
        ov?.branding?.watermarkText,
        ov?.branding?.watermark,
        ov?.branding?.water_mark,
        ov?.metadata?.watermarkText,
        ov?.metadata?.watermark?.text,
        ov?.metadata?.watermark,
        ov?.watermarkText,
        ov?.watermark?.text,
        ov?.watermark
      ];

      for (const cand of cands) {
        if (cand === undefined || cand === null) continue;
        if (typeof cand === 'string' && cand.trim()) return cand;
        if (Array.isArray(cand) && cand.length && cand.every(x => typeof x === 'string')) {
          return cand.join(' ');
        }
        if (typeof cand === 'object') {
          if (typeof cand.text === 'string' && cand.text.trim()) return cand.text;
          const values = Object.values(cand);
          const first = values.find(v => typeof v === 'string' && (v as string).trim());
          if (typeof first === 'string') return first;
        }
      }

      // Deep scan for any key containing "watermark"
      const visited = new Set();
      const stack = [ov];
      
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== 'object' || visited.has(cur)) continue;
        visited.add(cur);
        
        for (const [k, v] of Object.entries(cur)) {
          if (k.toLowerCase().includes('watermark')) {
            if (typeof v === 'string' && v.trim()) return v;
            if (Array.isArray(v) && v.length && v.every(x => typeof x === 'string')) return v.join(' ');
            if (v && typeof v === 'object') {
              const vv = (v as any).text;
              if (typeof vv === 'string' && vv.trim()) return vv;
            }
          }
          if (v && typeof v === 'object') stack.push(v);
        }
      }

      return '';
    };

    const resolvedWatermark = watermarkText || extractWatermarkText(overlay);

    if (process.env.NEXT_PUBLIC_DEBUG_WATERMARK === '1') {
      console.debug('[BrandingInitializer] Processing watermark:', {
        overlayName,
        watermarkText,
        resolvedWatermark,
        branding: overlay.branding
      });
    }

    brandingDispatch({
      type: ActionType.SET_BRANDING,
      payload: {
        logo: overlay.branding.logo ?? '',
        backgroundImage: overlay.branding.backgroundImage ?? '',
        backgroundImageSlice: overlay.branding.backgroundImageSlice ?? '',
        primaryBackgroundColor: overlay.branding.primaryBackgroundColor ?? '',
        secondaryBackgroundColor: overlay.branding.secondaryBackgroundColor ?? '',
        primaryAttribute: overlay.branding.primaryAttribute ?? '',
        secondaryAttribute: overlay.branding.secondaryAttribute ?? '',
        watermarkText: resolvedWatermark
      }
    });
  }, [overlay, watermarkText, overlayName, brandingDispatch]);

  return null;
}

interface SearchResultBundleCardProps {
  bundle: BundleWithLedger;
  onClick: () => void;
}

export default function SearchResultBundleCard({ bundle, onClick }: SearchResultBundleCardProps) {
  const [overlay, setOverlay] = useState<OverlayBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOverlay = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const bundleData = await fetchOverlayBundleData(bundle, { includeTestData: false });
        
        if (!isMounted) return;

        if (bundleData && bundleData.overlay) {
          setOverlay(bundleData.overlay);
        } else {
          setError('Failed to load overlay data');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading overlay:', err);
        setError('Failed to load overlay data');
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
  }, [bundle]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error || !overlay) {
    return (
      <Box
        display="flex"
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
          '&:hover': {
            backgroundColor: 'error.dark'
          }
        }}
        onClick={onClick}
      >
        <Box textAlign="center" p={2}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            {bundle.name || bundle.id}
          </div>
          <div style={{ fontSize: '12px' }}>
            {error || 'No overlay data available'}
          </div>
          {bundle.ledgerDisplayName && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              {bundle.ledgerDisplayName}
            </div>
          )}
        </Box>
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
      <BrandingInitializer 
        overlay={overlay} 
        overlayName={bundle.name || bundle.id}
      />
      <CredentialCard overlay={overlay} />
    </Box>
  );
}