import React, { CSSProperties } from "react";
import Image from "next/image";
import { useBranding } from "../contexts/Branding";
import { textColorForBackground } from "@hyperledger/aries-oca";
import { OverlayBundle } from "@hyperledger/aries-oca";
import { CredentialExchangeRecord } from "@aries-framework/core";
import { useMemo, useState } from "react";
import {
  CredentialFormatter,
  DisplayAttribute,
  LocalizedCredential,
} from "@hyperledger/aries-oca";

const width = 360;
const borderRadius = 10;
const padding = width * 0.05;
const logoHeight = width * 0.12;

function computedStyles(branding: any): Record<string, CSSProperties> {
  return {
    container: {
      borderRadius: borderRadius,
      position: "relative",
      overflow: "hidden",
    },
    cardContainer: {
      flexDirection: "row",
      minHeight: 0.45 * width, // Increased height for better BC Wallet proportion
      backgroundColor: branding?.primaryBackgroundColor || "#003366",
      borderRadius: borderRadius,
      position: "relative",
      overflow: "hidden",
      marginBottom: 16,
    },
    primaryBodyContainer: {
      flexShrink: 1,
      padding: 0,
      margin: -1,
      marginLeft: -1 * logoHeight + padding,
      paddingTop: padding,
    },
    secondaryBodyContainer: {
      width: logoHeight,
      borderTopLeftRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      backgroundColor:
        (branding?.backgroundImageSlice
          ? "rgba(0, 0, 0, 0)"
          : branding?.secondaryBackgroundColor) || "rgba(0, 0, 0, 0.24)",
    },
    logoContainer: {
      top: padding,
      left: -1 * logoHeight + padding,
      width: logoHeight,
      height: logoHeight,
      backgroundColor: "rgba(255, 255, 255, 1)",
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    },
    textContainer: {
      color: textColorForBackground(
        branding?.primaryBackgroundColor || "#003366"
      ),
      flexShrink: 1,
    },
    normal: {
      fontSize: 18,
      fontWeight: "normal",
    },
    listText: {
      fontSize: 14,
      fontWeight: "normal",
    },
    listBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.1)",
      marginTop: 8,
    },
  };
}

function getOverlayAttribute(
  name: string,
  overlay: OverlayBundle | undefined,
  credential: LocalizedCredential | undefined,
  language: string | undefined
): DisplayAttribute | undefined {
  const attribute = credential?.getAttribute(name);
  const overlayOptions = overlay?.getAttribute(name);

  if (overlayOptions) {
    const name = attribute?.name ?? "";
    const mimeType = attribute?.mimeType ?? "";
    const value = attribute?.value ?? "";
    return new DisplayAttribute(
      { name, mimeType, value },
      overlayOptions,
      language ?? "en"
    );
  }

  return;
}


function CredentialDetail10({
  overlay,
  record,
  language,
}: {
  overlay?: OverlayBundle;
  record?: CredentialExchangeRecord;
  language?: string;
}) {
  const branding = useBranding();
  const styles = computedStyles(branding);

  const [formatter, setFormatter] = useState<CredentialFormatter | undefined>();

  useMemo(() => {
    if (!(overlay && record)) {
      return;
    }
    // Cast to the expected type to handle compatibility between aries-framework and credo-ts
    const compatibleRecord = record as any;
    setFormatter(new CredentialFormatter(overlay, compatibleRecord));
  }, [overlay, record]);

  const localizedCredential = formatter?.localizedCredential(language ?? "en");

  return (
    <div style={{ width: '360px', margin: '0 auto' }}>
      {/* BC Wallet Style Credential Details */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* BC Wallet Style Header - Background Image Top, Blue Section Bottom */}
        <div
          style={{
            position: 'relative',
            height: '200px',
            overflow: 'hidden',
          }}
        >
          {/* Background Image Section - Top Half */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              backgroundImage: branding?.backgroundImage ? `url(${branding.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#333',
            }}
          />

          {/* Blue Background Section - Bottom Half */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              backgroundColor: branding?.primaryBackgroundColor || '#003366',
            }}
          />

          {/* Logo Container - Spanning Both Sections */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '24px',
              transform: 'translateY(-50%)',
              width: '80px',
              height: '80px',
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              zIndex: 10,
            }}
          >
            {branding?.logo ? (
              <Image
                src={branding.logo}
                alt="BC Logo"
                width={72}
                height={72}
                style={{
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div style={{
                fontSize: '40px',
                color: '#003366',
                fontWeight: 'bold'
              }}>🏛️</div>
            )}
          </div>

          {/* Text Content Layout */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Row: Issuer Name (to the right of logo) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                paddingTop: '2px',
                paddingRight: '0px',
                marginBottom: 'auto',
              }}
            >
              <div
                style={{
                  color: textColorForBackground(branding?.primaryBackgroundColor || '#003366'),
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: 1.3,
                  letterSpacing: '0.3px',
                  fontFamily: 'BC Sans, Arial, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '220px',
                }}
              >
                {overlay?.metadata?.issuer ? (
                  typeof overlay.metadata.issuer === 'string'
                    ? overlay.metadata.issuer
                    : overlay.metadata.issuer?.[language || 'en'] || ''
                ) : ''}
              </div>
            </div>

            {/* Bottom Row: Credential Name (below logo, aligned left) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '0px',
                height: '100%',
              }}
            >
              <div
                style={{
                  color: textColorForBackground(branding?.primaryBackgroundColor || '#003366'),
                  fontSize: '20px',
                  fontWeight: '300',
                  lineHeight: 1.2,
                  letterSpacing: '0.3px',
                  fontFamily: 'BC Sans, Arial, sans-serif',
                }}
              >
                {overlay?.metadata?.name ? (
                  typeof overlay.metadata.name === 'string'
                    ? overlay.metadata.name
                    : overlay.metadata.name?.[language || 'en'] || ''
                ) : ''}
              </div>
            </div>
          </div>
        </div>

        {/* White Details Section */}
        <div style={{ backgroundColor: 'white' }}>
          {/* Hide All Button */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 16,
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                color: '#1976d2',
                fontSize: 14,
                fontWeight: '500',
                fontFamily: 'BC Sans, Arial, sans-serif',
              }}
            >
              Hide all
            </div>
          </div>

          {/* Attributes List */}
          {localizedCredential?.attributes?.map((attr, index) => {
            const overlayAttribute = getOverlayAttribute(attr.name, overlay, localizedCredential, language) ?? attr;
            const displayLabel = overlayAttribute?.label || overlayAttribute?.name || '';
            const displayValue = overlayAttribute?.value || attr?.value || '.......';

            return (
              <div
                key={index}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: 16,
                      color: '#333',
                      marginBottom: 4,
                      fontFamily: 'BC Sans, Arial, sans-serif',
                    }}
                  >
                    {displayLabel}
                  </div>
                  <div
                    style={{
                      fontWeight: '400',
                      fontSize: 16,
                      color: '#333',
                      fontFamily: 'BC Sans, Arial, sans-serif',
                    }}
                  >
                    {displayValue}
                  </div>
                </div>
                <div
                  style={{
                    color: '#1976d2',
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'BC Sans, Arial, sans-serif',
                  }}
                >
                  Show
                </div>
              </div>
            );
          })}

          {/* Issued Information */}
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 4,
                fontWeight: '500',
                fontFamily: 'BC Sans, Arial, sans-serif',
              }}
            >
              Issued by: {overlay?.metadata?.issuer ? (
                typeof overlay.metadata.issuer === 'string'
                  ? overlay.metadata.issuer
                  : overlay.metadata.issuer?.[language || 'en']
              ) : ''}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#666',
                fontWeight: '500',
                fontFamily: 'BC Sans, Arial, sans-serif',
              }}
            >
              Issued: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CredentialDetail10;