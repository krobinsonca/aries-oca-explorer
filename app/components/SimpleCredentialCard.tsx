'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { OverlayBundle } from '@hyperledger/aries-oca';
import { CredentialExchangeRecord, CredentialPreviewAttribute, CredentialState } from '@aries-framework/core';
import { fetchOverlayBundleData } from '@/app/lib/data';
import CredentialCard from './CredentialCard';
import { BundleWithLedger } from '@/app/lib/data';
import { BrandingProvider, useBrandingDispatch, ActionType } from '@/app/contexts/Branding';

interface SimpleCredentialCardProps {
  bundle: BundleWithLedger;
  onClick: () => void;
  language?: string;
}

// Helper function to create a credential record from overlay data
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
    threadId: `simple-${bundle.id}`,
    protocolVersion: "1.0",
    state: CredentialState.OfferReceived,
    credentialAttributes: Object.entries(attributes).map(
      ([name, value]) => new CredentialPreviewAttribute({ name, value })
    ),
  });
}

// Component that handles branding for individual cards
function BrandingInitializer({ overlay, watermarkText, bundle }: {
  overlay: OverlayBundle | null;
  watermarkText: string | undefined;
  bundle: BundleWithLedger;
}) {
  const brandingDispatch = useBrandingDispatch();

  useEffect(() => {
    if (!brandingDispatch || !overlay?.branding) return;

    const extractWatermarkText = (ov: any): string | Record<string, string> | undefined => {
      const cands: any[] = [
        ov?.branding?.watermarkText,
        ov?.branding?.watermark,
        ov?.metadata?.watermarkText,
        ov?.metadata?.watermark?.text,
        ov?.metadata?.watermark,
        ov?.watermark,
      ];

      for (const cand of cands) {
        if (cand === undefined || cand === null) continue;
        if (typeof cand === 'string') {
          if (cand.trim()) {
            return cand;
          } else {
            continue;
          }
        }
        if (Array.isArray(cand) && cand.length && cand.every(x => typeof x === 'string')) {
          const result = (cand as string[]).join(' ');
          if (result.trim()) {
            return result;
          } else {
            continue;
          }
        }
        if (typeof cand === 'object' && cand !== null) {
          // Check if it's a localized object like { "en": "text", "fr": "texte" }
          const entries = Object.entries(cand as Record<string, unknown>);
          const validEntries = entries.filter(([key, value]) =>
            typeof value === 'string' && (value as string).trim()
          );

          if (validEntries.length > 0) {
            // Return the full object to preserve language-specific watermarks
            const result: Record<string, string> = {};
            validEntries.forEach(([key, value]) => {
              result[key] = value as string;
            });
            return result;
          }

          // Check for nested text property
          if (typeof (cand as any).text === 'string') {
            if ((cand as any).text.trim()) {
              return (cand as any).text;
            } else {
              continue;
            }
          }
        }
      }

      return undefined;
    };

    const extractedWatermark = extractWatermarkText(overlay);
    const resolvedWatermark = watermarkText || extractedWatermark;

    const finalWatermark = (typeof resolvedWatermark === 'string' && resolvedWatermark.trim()) ||
                          (typeof resolvedWatermark === 'object' && resolvedWatermark !== null && Object.values(resolvedWatermark).some(v => typeof v === 'string' && v.trim()))
                          ? resolvedWatermark
                          : undefined;

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
        watermarkText: finalWatermark,
      }
    });
  }, [overlay, watermarkText, bundle.id, brandingDispatch]);

  return null;
}

function SimpleCredentialCardContent({ bundle, onClick, language = 'en' }: SimpleCredentialCardProps) {
  const [overlay, setOverlay] = useState<OverlayBundle | null>(null);
  const [mockRecord, setMockRecord] = useState<CredentialExchangeRecord | null>(null);
  const [watermarkText, setWatermarkText] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOverlay = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchOverlayBundleData(bundle, { includeTestData: false });

        if (!isMounted) return;

        if (result && result.overlay) {
          setOverlay(result.overlay);
          setWatermarkText(typeof result.watermarkText === 'string' ? result.watermarkText : undefined);
          // Create credential record for rendering
          const record = createCredentialRecord(result.overlay, bundle, result.data);
          setMockRecord(record);
        } else {
          setError('No overlay data');
        }
      } catch (err) {
        if (!isMounted) return;
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
  }, [bundle]);

  // Branding is now handled by BrandingInitializer component

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

  return (
    <Box
      sx={{
        cursor: 'pointer',
        display: 'inline-block',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        }
      }}
      onClick={onClick}
    >
      <CredentialCard overlay={overlay || undefined} record={mockRecord || undefined} language={language} />
      {/* All IDs below the card */}
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {bundle.ids && bundle.ids.length > 1 ? (
          (() => {
            // Group IDs by type
            const schemaIds = bundle.ids.filter(id => !id.includes(':3:CL:'));
            const credDefIds = bundle.ids.filter(id => id.includes(':3:CL:'));
            
            return (
              <>
                {schemaIds.length > 0 && (
                  <Box sx={{ mb: credDefIds.length > 0 ? 2 : 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#6c757d',
                        display: 'block',
                        mb: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {schemaIds.length > 1 ? 'Schema IDs' : 'Schema ID'}
                    </Typography>
                    {schemaIds.map((id, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#212529',
                          wordBreak: 'break-all',
                          lineHeight: 1.4,
                          backgroundColor: '#ffffff',
                          padding: '6px 8px',
                          borderRadius: 1,
                          border: '1px solid #dee2e6',
                          display: 'block',
                          mb: index < schemaIds.length - 1 ? 1 : 0,
                        }}
                      >
                        {id}
                      </Typography>
                    ))}
                  </Box>
                )}
                {credDefIds.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#6c757d',
                        display: 'block',
                        mb: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {credDefIds.length > 1 ? 'Credential Definition IDs' : 'Credential Definition ID'}
                    </Typography>
                    {credDefIds.map((id, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#212529',
                          wordBreak: 'break-all',
                          lineHeight: 1.4,
                          backgroundColor: '#ffffff',
                          padding: '6px 8px',
                          borderRadius: 1,
                          border: '1px solid #dee2e6',
                          display: 'block',
                          mb: index < credDefIds.length - 1 ? 1 : 0,
                        }}
                      >
                        {id}
                      </Typography>
                    ))}
                  </Box>
                )}
              </>
            );
          })()
        ) : (
          <>
            <Typography
              variant="caption"
              sx={{
                fontSize: '9px',
                fontWeight: 600,
                color: '#6c757d',
                display: 'block',
                mb: 1,
                textTransform: 'uppercase',
              }}
            >
              {bundle.id.includes(':3:CL:') ? 'Credential Definition ID' : 'Schema ID'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#212529',
                wordBreak: 'break-all',
                lineHeight: 1.4,
                backgroundColor: '#ffffff',
                padding: '6px 8px',
                borderRadius: 1,
                border: '1px solid #dee2e6',
                display: 'block',
              }}
            >
              {bundle.id}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

function SimpleCredentialCardWithBranding({ bundle, onClick, language = 'en' }: SimpleCredentialCardProps) {
  const [overlay, setOverlay] = useState<OverlayBundle | null>(null);
  const [mockRecord, setMockRecord] = useState<CredentialExchangeRecord | null>(null);
  const [watermarkText, setWatermarkText] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const loadOverlay = async () => {
      try {
        const result = await fetchOverlayBundleData(bundle, { includeTestData: false });

        if (!isMounted) return;

        if (result && result.overlay) {
          setOverlay(result.overlay);
          setWatermarkText(typeof result.watermarkText === 'string' ? result.watermarkText : undefined);
          // Create credential record for rendering
          const record = createCredentialRecord(result.overlay, bundle, result.data);
          setMockRecord(record);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading overlay:', err);
      }
    };

    loadOverlay();

    return () => {
      isMounted = false;
    };
  }, [bundle]);

  return (
    <>
      <BrandingInitializer overlay={overlay} watermarkText={watermarkText} bundle={bundle} />
      <SimpleCredentialCardContent bundle={bundle} onClick={onClick} language={language} />
    </>
  );
}

export default function SimpleCredentialCard({ bundle, onClick, language = 'en' }: SimpleCredentialCardProps) {
  return (
    <BrandingProvider>
      <SimpleCredentialCardWithBranding bundle={bundle} onClick={onClick} language={language} />
    </BrandingProvider>
  );
}