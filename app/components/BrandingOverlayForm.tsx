import React from "react";
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  Button,
  FormControl,
  TextField,
} from "@mui/material";
import { SaveAlt } from "@mui/icons-material";
import { MuiColorInput } from "mui-color-input";
import { useEffect } from "react";
import {
  ActionType,
  useBranding,
  useBrandingDispatch,
} from "../contexts/Branding";
import { saveAs } from "file-saver";
import BrandingOverlayDataFactory from "../services/OverlayBrandingDataFactory";
import { OverlayBundle } from "@hyperledger/aries-oca";
import ImageField from "./ImageField";

export default function BrandingOverlayForm({
  overlay,
  readonly = false
}: {
  overlay?: OverlayBundle;
  language?: string;
  readonly: boolean;
}) {
  const branding = useBranding();
  const dispatch = useBrandingDispatch();

  useEffect(() => {
    dispatch &&
      dispatch({
        type: ActionType.SET_BRANDING,
        payload: {
          logo: overlay?.branding?.logo ?? "",
          backgroundImage: overlay?.branding?.backgroundImage ?? "",
          backgroundImageSlice: overlay?.branding?.backgroundImageSlice ?? "",
          primaryBackgroundColor:
            overlay?.branding?.primaryBackgroundColor ?? "",
          secondaryBackgroundColor:
            overlay?.branding?.secondaryBackgroundColor ?? "",
          primaryAttribute: overlay?.branding?.primaryAttribute ?? "",
          secondaryAttribute: overlay?.branding?.secondaryAttribute ?? "",
        },
      });
  }, [overlay, dispatch]);

  if (readonly) {
    return null;
  }

  return (
    <div id="overlay-bundle-branding-form">
      <div id="overlay-bundle-branding-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ImageField
          id="logo"
          label="Logo"
          value={branding?.logo ?? ""}
          onContent={(content: string) =>
            dispatch &&
            dispatch({
              type: ActionType.LOGO,
              payload: { logo: content },
            })
          }
        />
        <ImageField
          id="background-image"
          label="Background Image"
          value={branding?.backgroundImage ?? ""}
          onContent={(content: string) => {
            dispatch &&
              dispatch({
                type: ActionType.BACKGROUND_IMAGE,
                payload: { backgroundImage: content },
              });
          }}
        />
        <ImageField
          id="background-image-slice"
          label="Background Image Slice"
          value={branding?.backgroundImageSlice ?? ""}
          onContent={(content: string) => {
            dispatch &&
              dispatch({
                type: ActionType.BACKGROUND_IMAGE_SLICE,
                payload: { backgroundImageSlice: content },
              });
          }}
        />
        <MuiColorInput
          fullWidth
          id="primary-background-color"
          label="Primary Background Color"
          value={branding?.primaryBackgroundColor ?? ""}
          onChange={(value) => {
            dispatch &&
              dispatch({
                type: ActionType.PRIMARY_BACKGROUND_COLOR,
                payload: { primaryBackgroundColor: value },
              });
          }}
          margin="dense"
          size="small"
        />
        <MuiColorInput
          fullWidth
          id="secondary-background-color"
          label="Secondary Background Color"
          value={branding?.secondaryBackgroundColor ?? ""}
          onChange={(value) => {
            dispatch &&
              dispatch({
                type: ActionType.SECONDARY_BACKGROUND_COLOR,
                payload: { secondaryBackgroundColor: value },
              });
          }}
          margin="dense"
          size="small"
        />
        <FormControl fullWidth>
          <Autocomplete
            id="primary-attribute"
            options={Object.entries(overlay?.captureBase?.attributes || {}).map(
              ([key]) => key
            )}
            value={branding?.primaryAttribute || null}
            onChange={(_e, value) => {
              dispatch &&
                dispatch({
                  type: ActionType.PRIMARY_ATTRIBUTE,
                  payload: { primaryAttribute: value || "" },
                });
            }}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label="Primary Attribute"
                margin="dense"
                size="small"
              />
            )}
          />
        </FormControl>
        <FormControl fullWidth>
          <Autocomplete
            id="secondary-attribute"
            options={Object.entries(overlay?.captureBase?.attributes || {}).map(
              ([key]) => key
            )}
            value={branding?.secondaryAttribute || null}
            onChange={(_e, value) => {
              dispatch &&
                dispatch({
                  type: ActionType.SECONDARY_ATTRIBUTE,
                  payload: { secondaryAttribute: value || "" },
                });
            }}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label="Secondary Attribute"
                margin="dense"
                size="small"
              />
            )}
          />
        </FormControl>
        <TextField
          fullWidth
          id="watermark-text"
          label="Watermark Text"
          value={branding?.watermarkText ?? ""}
          onChange={(e) => {
            dispatch &&
              dispatch({
                type: ActionType.WATERMARK_TEXT,
                payload: { watermarkText: e.target.value },
              });
          }}
          margin="dense"
          size="small"
          placeholder="e.g., NON-PRODUCTION"
        />
      </div>
      <FormControl margin="dense" size="small" style={{ width: '100%', marginTop: '16px' }}>
        <Button
          id="overlay-branding-download-branding-overlay"
          disabled={!branding}
          variant="contained"
          component="label"
          startIcon={<SaveAlt />}
          onClick={() => {
            if (!branding) {
              return;
            }
            const blob = new Blob(
              [
                JSON.stringify(
                  BrandingOverlayDataFactory.getBrandingOverlayData(branding),
                  null,
                  2
                ),
              ],
              {
                type: "text/plain;charset=utf-8",
              }
            );
            saveAs(blob, "branding.json");
          }}
        >
          Download Branding Overlay
        </Button>
      </FormControl>
    </div>
  );
};
