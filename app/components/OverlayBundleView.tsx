'use client';

import React from "react";
import {
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
  Box,
  Paper
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useCallback, useEffect, useState } from "react";
import { BrandingProvider, useBrandingDispatch, ActionType } from "@/app/contexts/Branding";
import CredentialCard from "@/app/components/CredentialCard";
import CredentialDetail from "@/app/components/CredentialDetail";
import OverlayBrandingForm from "@/app/components/BrandingOverlayForm";
import { OverlayBundle } from "@hyperledger/aries-oca";
import { Info } from "@mui/icons-material";
import { CredentialExchangeRecord, CredentialPreviewAttribute, CredentialState } from "@aries-framework/core";
import { fetchOverlayBundleData } from "@/app/lib/data";
import { useSearchParams } from "next/navigation";

function BrandingInitializer({
  overlay,
  watermarkText,
  overlayName
}: {
  overlay?: OverlayBundle;
  watermarkText?: string;
  overlayName?: string;
}) {
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
    const resolvedWatermark = watermarkText || extractedWatermark;


    // Only set watermark if we have valid content
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
  }, [brandingDispatch, overlay, watermarkText, overlayName]);

  return null;
}

function OverlayBundleViewContent({ option }: { option: any }) {
  const searchParams = useSearchParams();
  const readonly = searchParams.get('view') === 'readonly';

  const [overlayData, setOverlayData] = useState<{
    overlay: OverlayBundle | undefined;
    record: CredentialExchangeRecord | undefined;
    watermarkText?: string;
  }>({ overlay: undefined, record: undefined });
  const [language, setLanguage] = useState<string>("");

  // Reset scroll position when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { overlay, data, watermarkText } = await fetchOverlayBundleData(option, { includeTestData: true });

      // Use the same record creation logic as SearchResultBundleCard
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

      const record = new CredentialExchangeRecord({
        threadId: "detail-view",
        protocolVersion: "1.0",
        state: CredentialState.OfferReceived,
        credentialAttributes: Object.entries(attributes).map(
          ([name, value]) => new CredentialPreviewAttribute({ name, value })
        ),
      });
      setOverlayData({ overlay, record, watermarkText: typeof watermarkText === 'string' ? watermarkText : undefined });
    }

    fetchData();
  }, [option]);

  useEffect(() => {
    if (!overlayData?.overlay) return;
    setLanguage(overlayData.overlay.languages[0] || 'en');
  }, [overlayData?.overlay]);

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value);
  }, []);

  if (!overlayData?.overlay || !overlayData?.record) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" color="text.secondary">Loading credential details...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          {overlayData.overlay?.metadata?.name ? (
            typeof overlayData.overlay.metadata.name === 'string'
              ? overlayData.overlay.metadata.name
              : overlayData.overlay.metadata.name?.[language] || ''
          ) : ''}
          {overlayData.overlay?.metadata?.credentialHelpText && (
            <Tooltip
              title={typeof overlayData.overlay.metadata.credentialHelpText === 'string'
                ? overlayData.overlay.metadata.credentialHelpText
                : overlayData.overlay.metadata.credentialHelpText?.[language] ?? ""}
              arrow
            >
              <Info sx={{ ml: 1, fontSize: '1.2rem', color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {overlayData.overlay?.metadata?.description ? (
            typeof overlayData.overlay.metadata.description === 'string'
              ? overlayData.overlay.metadata.description
              : overlayData.overlay.metadata.description?.[language] || ''
          ) : ''}
        </Typography>

        {overlayData.overlay?.metadata?.issuer && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Issued by: {typeof overlayData.overlay.metadata.issuer === 'string'
              ? overlayData.overlay.metadata.issuer
              : overlayData.overlay.metadata.issuer?.[language] || ''}
            {overlayData.overlay.metadata?.issuerDescription && (
              <Tooltip
                title={typeof overlayData.overlay.metadata.issuerDescription === 'string'
                  ? overlayData.overlay.metadata.issuerDescription
                  : overlayData.overlay.metadata.issuerDescription?.[language] ?? ""}
                arrow
              >
                <Info sx={{ ml: 1, fontSize: 'inherit' }} />
              </Tooltip>
            )}
          </Typography>
        )}

        {overlayData.overlay?.metadata?.issuerUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Issuer URL: <a
              href={typeof overlayData.overlay.metadata.issuerUrl === 'string'
                ? overlayData.overlay.metadata.issuerUrl
                : overlayData.overlay.metadata.issuerUrl?.[language] || Object.values(overlayData.overlay.metadata.issuerUrl)[0] || ''}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              {typeof overlayData.overlay.metadata.issuerUrl === 'string'
                ? overlayData.overlay.metadata.issuerUrl
                : overlayData.overlay.metadata.issuerUrl?.[language] || Object.values(overlayData.overlay.metadata.issuerUrl)[0] || ''}
            </a>
          </Typography>
        )}

        {overlayData.overlay?.metadata?.credentialSupportUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Support URL: <a
              href={typeof overlayData.overlay.metadata.credentialSupportUrl === 'string'
                ? overlayData.overlay.metadata.credentialSupportUrl
                : overlayData.overlay.metadata.credentialSupportUrl?.[language] || Object.values(overlayData.overlay.metadata.credentialSupportUrl)[0] || ''}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              {typeof overlayData.overlay.metadata.credentialSupportUrl === 'string'
                ? overlayData.overlay.metadata.credentialSupportUrl
                : overlayData.overlay.metadata.credentialSupportUrl?.[language] || Object.values(overlayData.overlay.metadata.credentialSupportUrl)[0] || ''}
            </a>
          </Typography>
        )}

        {/* Language Selection */}
        {overlayData.overlay?.languages && overlayData.overlay.languages.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <FormControl>
              <FormLabel sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={500}>Language</Typography>
              </FormLabel>
              <RadioGroup
                name="language"
                onChange={(e) => handleLanguageChange(e.target.value)}
                value={language}
                row
              >
                {overlayData.overlay.languages.map((lang) => (
                  <FormControlLabel
                    key={lang}
                    value={lang}
                    control={<Radio size="small" />}
                    label={lang.toUpperCase()}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left Column - Card and Branding */}
        <Grid xs={12} md={6}>
          {/* Credential Card */}
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
              Credential Preview
            </Typography>
            <Box display="flex" justifyContent="center">
              {(() => {
                const metaName: any = overlayData.overlay?.metadata?.name;
                const overlayName = typeof metaName === 'string'
                  ? metaName
                  : metaName && typeof metaName === 'object'
                    ? (metaName[Object.keys(metaName)[0]] as string)
                    : option?.id || 'Unknown';

                return (
                  <>
                    <BrandingInitializer
                      overlay={overlayData.overlay}
                      watermarkText={overlayData.watermarkText}
                      overlayName={overlayName}
                    />
                    <CredentialCard
                      overlay={overlayData.overlay}
                      record={overlayData.record}
                      language={language}
                    />
                  </>
                );
              })()}
            </Box>
          </Paper>

          {/* Branding Configuration */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
              Branding Configuration
            </Typography>
            <OverlayBrandingForm
              overlay={overlayData.overlay}
              language={language}
              readonly={readonly}
            />
          </Paper>
        </Grid>

        {/* Right Column - Details */}
        <Grid xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
              Credential Details
            </Typography>
            <CredentialDetail
              overlay={overlayData.overlay}
              record={overlayData.record}
              language={language}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default function OverlayBundleView(props: { option: any }) {
  return (
    <BrandingProvider>
      <OverlayBundleViewContent {...props} />
    </BrandingProvider>
  );
}