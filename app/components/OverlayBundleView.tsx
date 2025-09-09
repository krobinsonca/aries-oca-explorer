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
      // Deep scan for any key containing "watermark"
      const visited = new Set<any>();
      const stack: any[] = [ov];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== 'object' || visited.has(cur)) continue;
        visited.add(cur);
        for (const [k, v] of Object.entries(cur)) {
          if (k.toLowerCase().includes('watermark')) {
            if (typeof v === 'string' && v.trim()) return v;
            if (Array.isArray(v) && v.length && v.every(x => typeof x === 'string')) return (v as string[]).join(' ');
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

    const DEBUG_WATERMARK = process.env.NEXT_PUBLIC_DEBUG_WATERMARK === '1';
    if (DEBUG_WATERMARK && typeof window !== 'undefined') {
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

  useEffect(() => {
    async function fetchData() {
      const { overlay, data, watermarkText } = await fetchOverlayBundleData(option, { includeTestData: true });
      const record = new CredentialExchangeRecord({
        threadId: "detail-view",
        protocolVersion: "1.0",
        state: CredentialState.OfferReceived,
        credentialAttributes: Object.entries(data || {}).map(
          ([name, value]) => new CredentialPreviewAttribute({ name, value })
        ),
      });
      setOverlayData({ overlay, record, watermarkText });
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