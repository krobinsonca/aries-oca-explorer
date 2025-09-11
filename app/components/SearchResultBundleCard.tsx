'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { OverlayBundle } from '@hyperledger/aries-oca';
import { CredentialExchangeRecord, CredentialPreviewAttribute, CredentialState } from '@aries-framework/core';
import { useBrandingDispatch, ActionType, BrandingProvider } from '@/app/contexts/Branding';
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

    const extractWatermarkText = (ov: any): string | undefined => {
      // Only check specific, known watermark fields - no deep scanning
      const cands: any[] = [
        ov?.branding?.watermarkText,
        ov?.branding?.watermark,
        ov?.metadata?.watermarkText,
        ov?.metadata?.watermark?.text,
        ov?.metadata?.watermark,
        // Also check direct watermark field in the overlay (not just metadata)
        ov?.watermark,
      ];

      for (const cand of cands) {
        if (cand === undefined || cand === null) continue;
        if (typeof cand === 'string') {
          if (cand.trim()) {
            return cand;
          } else {
            // Empty/whitespace string found - explicitly return undefined
            return undefined;
          }
        }
        if (Array.isArray(cand) && cand.length && cand.every(x => typeof x === 'string')) {
          const result = (cand as string[]).join(' ');
          if (result.trim()) {
            return result;
          } else {
            return undefined;
          }
        }
        if (typeof cand === 'object' && cand !== null) {
          if (typeof (cand as any).text === 'string') {
            if ((cand as any).text.trim()) {
              return (cand as any).text;
            } else {
              return undefined;
            }
          }
          // Check if it's a localized object like { "en": "text", "fr": "texte" }
          const values = Object.values(cand as Record<string, unknown>);
          const first = values.find(v => typeof v === 'string' && (v as string).trim());
          if (typeof first === 'string') {
            return first;
          }
          // Check if all values are empty strings
          if (values.length > 0 && values.every(v => typeof v === 'string' && !(v as string).trim())) {
            return undefined;
          }
        }
      }

      return undefined;
    };

    const extractedWatermark = extractWatermarkText(overlay);
    let resolvedWatermark = watermarkText || extractedWatermark;

    // Only use watermark if it exists and has valid content
    if (typeof resolvedWatermark === 'string' && (!resolvedWatermark || !resolvedWatermark.trim())) {
      resolvedWatermark = undefined;
    } else if (typeof resolvedWatermark === 'object' && !Object.values(resolvedWatermark).some(v => typeof v === 'string' && v.trim())) {
      resolvedWatermark = undefined;
    }



    brandingDispatch({
      type: ActionType.SET_BRANDING,
      payload: {
        logo: overlay.branding.logo ?? "",
        backgroundImage: overlay.branding.backgroundImage ?? "",
        backgroundImageSlice: overlay.branding.backgroundImageSlice ?? "",
        primaryBackgroundColor: overlay.branding.primaryBackgroundColor ?? "",
        secondaryBackgroundColor: overlay.branding.secondaryBackgroundColor ?? "",
        primaryAttribute: overlay.branding.primaryAttribute ?? "",
        secondaryAttribute: overlay.branding.secondaryAttribute ?? "",
        watermarkText: resolvedWatermark,
      }
    });
  }, [overlay, watermarkText, overlayName, brandingDispatch]);

  return null;
}

interface SearchResultBundleCardProps {
  bundle: BundleWithLedger;
  onClick: () => void;
}

function createCredentialRecord(
  overlay: OverlayBundle,
  bundle: BundleWithLedger,
  data?: Record<string, string>
): CredentialExchangeRecord {
  // Prefer real test data when available
  let attributes: Record<string, string> = data || {};

  // If no test data, derive placeholder attributes from captureBase (handles array or object)
  if (Object.keys(attributes).length === 0 && (overlay as any)?.captureBase?.attributes) {
    const cap = (overlay as any).captureBase.attributes;
    if (Array.isArray(cap)) {
      cap.forEach((attr: any) => {
        if (attr?.name) attributes[attr.name] = `........`;
      });
    } else if (typeof cap === 'object') {
      Object.keys(cap).forEach((name) => {
        attributes[name] = `........`;
      });
    }
  }

  // As a last resort, ensure there is at least one attribute so the formatter initializes
  if (Object.keys(attributes).length === 0) {
    attributes = { placeholder: 'sample' };
  }

  return new CredentialExchangeRecord({
    threadId: `search-${bundle.id}`,
    protocolVersion: "1.0",
    state: CredentialState.OfferReceived,
    credentialAttributes: Object.entries(attributes).map(
      ([name, value]) => new CredentialPreviewAttribute({ name, value })
    ),
  });
}

export default function SearchResultBundleCard({ bundle, onClick }: SearchResultBundleCardProps) {
  const [overlay, setOverlay] = useState<OverlayBundle | null>(null);
  const [mockRecord, setMockRecord] = useState<CredentialExchangeRecord | null>(null);
  const [watermarkText, setWatermarkText] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOverlay = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const bundleData = await fetchOverlayBundleData(bundle, { includeTestData: true });

        if (!isMounted) return;

        if (bundleData && bundleData.overlay) {
          setOverlay(bundleData.overlay);
          // Create credential record using the same logic as details page
          const record = createCredentialRecord(bundleData.overlay, bundle, bundleData.data);
          setMockRecord(record);
          // Store watermark text for BrandingInitializer
          setWatermarkText(typeof bundleData.watermarkText === 'string' ? bundleData.watermarkText : undefined);
          // Match details page language selection
          const selectedLang = (bundleData.overlay as any)?.languages?.[0] || 'en';
          setLanguage(selectedLang);
        } else {
          setError('Failed to load overlay data');
        }
      } catch (err) {
        if (!isMounted) return;
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
      {overlay && mockRecord ? (
        <BrandingProvider>
          <BrandingInitializer
            overlay={overlay}
            watermarkText={watermarkText}
            overlayName={bundle.name || bundle.id}
          />
          <Box sx={{ position: 'relative' }}>
            <CredentialCard overlay={overlay} record={mockRecord} language={language} />
          </Box>
        </BrandingProvider>
      ) : overlay ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
          sx={{
            border: 1,
            borderColor: 'warning.main',
            borderRadius: 1,
            backgroundColor: 'warning.light',
            color: 'warning.contrastText',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'warning.dark'
            }
          }}
          onClick={onClick}
        >
          <Box textAlign="center" p={2}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              {bundle.name || bundle.id}
            </div>
            <div style={{ fontSize: '12px' }}>
              Overlay loaded but no mock record
            </div>
            {bundle.ledgerDisplayName && (
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                {bundle.ledgerDisplayName}
              </div>
            )}
          </Box>
        </Box>
      ) : (
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
      )}
    </Box>
  );
}