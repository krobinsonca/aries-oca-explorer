'use client';

import React from "react";
import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useCallback, useEffect, useState } from "react";
import { BrandingProvider } from "@/app/contexts/Branding";
import CredentialCard from "@/app/components/CredentialCard";
import CredentialDetail from "@/app/components/CredentialDetail";
import OverlayBrandingForm from "@/app/components/BrandingOverlayForm";
import { OverlayBundle } from "@hyperledger/aries-oca";
import { Info } from "@mui/icons-material";
import { CredentialExchangeRecord, CredentialPreviewAttribute, CredentialState } from "@aries-framework/core";
import { fetchOverlayBundleData } from "@/app/lib/data";

export default function OverlaBundleView({ option }: { option: any }) {
  const [overlayData, setOverlayData] = useState<{
    overlay: OverlayBundle | undefined;
    record: CredentialExchangeRecord | undefined;
  }>({ overlay: undefined, record: undefined });
  const [language, setLanguage] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const { overlay, data } = await fetchOverlayBundleData(option);
      const record = new CredentialExchangeRecord({
        threadId: "123",
        protocolVersion: "1.0",
        state: CredentialState.OfferReceived,
        credentialAttributes: Object.entries(data).map(
          ([name, value]) => new CredentialPreviewAttribute({ name, value })
        ),
      });
      setOverlayData({ overlay, record });
    }

    fetchData();
  }, [option]);


  useEffect(() => {
    if (!overlayData?.overlay) return;
    setLanguage(overlayData?.overlay.languages[0]);
  }, [overlayData?.overlay]);

  const handleChange = useCallback((value: string) => {
    setLanguage(value);
  }, []);

  return (
    overlayData?.overlay && overlayData?.record && <BrandingProvider>
      <Grid>
        {overlayData?.overlay.languages.length > 1 && (
          <Grid id="overlay-bundle-language-select">
            <FormControl fullWidth margin="dense">
              <FormLabel>Language</FormLabel>
              <RadioGroup
                aria-labelledby="overlay-bundle-language-label"
                name="language"
                onChange={(e) => handleChange(e.target.value)}
                value={language}
                row
              >
                {overlayData?.overlay.languages.map((language) => (
                  <FormControlLabel
                    key={language}
                    value={language}
                    control={<Radio />}
                    label={language}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
        )}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="overline">
                {overlayData?.overlay.metadata.name[language]}&nbsp;
                {overlayData?.overlay.metadata?.credentialHelpText && (
                  <Tooltip
                    title={
                      overlayData?.overlay.metadata?.credentialHelpText?.[language] ?? ""
                    }
                  >
                    <Info fontSize="small" style={{ marginBottom: 2 }} />
                  </Tooltip>
                )}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overlayData?.overlay.metadata.description[language]}
              </Typography>
              {overlayData?.overlay.metadata?.issuer && (
                <Typography variant="body2" color="text.secondary">
                  {overlayData?.overlay.metadata?.issuer?.[language]}&nbsp;
                  {overlayData?.overlay.metadata?.issuerDescription && (
                    <Tooltip
                      title={
                        overlayData?.overlay.metadata?.issuerDescription?.[language] ?? ""
                      }
                    >
                      <Info fontSize="inherit" style={{ marginBottom: 2 }} />
                    </Tooltip>
                  )}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid
          container
          gap={4}
          paddingTop="1em"
          display="flex"
          justifyContent="center"
        >
          <Grid
            md
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
          >
            <div id="overlay-bundle-credential-card">
              <CredentialCard
                overlay={overlayData?.overlay}
                record={overlayData?.record}
                language={language}
              />
            </div>
          </Grid>
          <Grid
            md
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
          >
            <div id="overlay-bundle-credential-details">
              <CredentialDetail
                overlay={overlayData?.overlay}
                record={overlayData?.record}
                language={language}
              />
            </div>
          </Grid>
        </Grid>
        <Grid>
          <OverlayBrandingForm overlay={overlayData?.overlay} language={language} />
        </Grid>
      </Grid>
    </BrandingProvider>
  );
};
