import React, { useState, useMemo } from 'react';
import { useBranding } from '@/app/contexts/Branding';
import { OverlayBundle } from '@hyperledger/aries-oca';
import { textColorForBackground } from '@hyperledger/aries-oca';
import { CredentialExchangeRecord } from '@aries-framework/core';
import { CredentialFormatter, DisplayAttribute, LocalizedCredential } from '@hyperledger/aries-oca';

const width = 360;
const borderRadius = 10;
const padding = width * 0.05;
const logoHeight = width * 0.12;

function computedStyles(branding: any): Record<string, React.CSSProperties> {
  console.log('computedStyles - branding:', branding);
  
  return {
    container: {
      backgroundColor: branding?.primaryBackgroundColor || "#003366",
      borderRadius: borderRadius,
      position: "relative",
      overflow: "hidden"
    },
    cardContainer: {
      flexDirection: "row",
      minHeight: 0.33 * width
    },
    primaryBodyContainer: {
      flexShrink: 1,
      padding,
      margin: -1,
      marginLeft: -1 * logoHeight + padding
    },
    secondaryBodyContainer: {
      width: logoHeight,
      borderTopLeftRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      backgroundColor: ((branding?.backgroundImageSlice) ? "rgba(0, 0, 0, 0)" : branding?.secondaryBackgroundColor) || "#003366"
    },
    logoContainer: {
      position: "absolute",
      top: padding,
      left: -1 * logoHeight + padding,
      width: logoHeight,
      height: logoHeight,
      backgroundColor: "rgba(255, 255, 255, 1)",
      borderRadius: 8,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)"
    },
    statusContainer: {
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      height: logoHeight,
      width: logoHeight,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    },
    textContainer: {
      color: textColorForBackground(branding?.primaryBackgroundColor || "#003366"),
      flexShrink: 1
    },
    attributeContainer: {
      marginTop: 15
    },
    label: {
      fontSize: 14,
      fontWeight: "bold"
    },
    labelSubtitle: {
      fontSize: 14,
      fontWeight: "normal"
    },
    normal: {
      fontSize: 18,
      fontWeight: "normal"
    }
  };
}

function IssuerName({
  issuer,
  styles,
}: {
  issuer?: string;
  styles?: Record<string, React.CSSProperties>;
}) {
  return (
    <div>
      <div
        style={{
          ...styles?.label,
          ...styles?.textContainer,
          lineHeight: "19px",
          opacity: 0.8,
          flex: 1,
          flexWrap: "wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {issuer}
      </div>
    </div>
  );
}

function CredentialName({
  name,
  styles,
}: {
  name?: string;
  styles?: Record<string, React.CSSProperties>;
}) {
  return (
    <div>
      <div
        style={{
          ...styles?.normal,
          ...styles?.textContainer,
          fontWeight: "bold",
          lineHeight: "24px",
          flex: 1,
          flexWrap: "wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function Attribute({
  attribute,
  styles,
}: {
  attribute: DisplayAttribute;
  styles?: Record<string, React.CSSProperties>;
}) {
  return (
    <div style={{...styles?.textContainer, ...styles?.attributeContainer}}>
      <div
        style={{
          ...styles?.labelSubtitle ?? {},
          ...styles?.textContainer ?? {},
          lineHeight: "19px",
          opacity: 0.8,
        }}
      >
        {attribute.label || attribute.name}
      </div>
      {attribute.characterEncoding === "base64" &&
      attribute.format?.includes("image") ? (
        <img
          src={attribute.value}
          alt="Image"
          style={{
            marginTop: 4,
            width: logoHeight,
            height: logoHeight,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <div
          style={{
            ...styles?.normal ?? {},
            ...styles?.textContainer ?? {},
            lineHeight: "24px"
          }}
        >
          {attribute.value}
        </div>
      )}
    </div>
  );
}

function CardSecondaryBody({
  styles,
}: {
  overlay?: OverlayBundle;
  styles?: Record<string, React.CSSProperties>;
}) {
  const branding = useBranding();

  return (
    <div style={styles?.secondaryBodyContainer}>
      {branding?.backgroundImageSlice ? (
        <div
          style={{
            backgroundImage: `url(${branding.backgroundImageSlice})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexGrow: 1,
            borderTopLeftRadius: borderRadius,
            borderBottomLeftRadius: borderRadius,
          }}
        />
      ) : null}
    </div>
  );
}

function CardLogo({
  credential,
  styles,
}: {
  credential?: LocalizedCredential;
  styles?: Record<string, React.CSSProperties>;
}) {
  const branding = useBranding();

  return (
    <div style={styles?.logoContainer}>
      {branding?.logo ? (
        <img
          src={branding?.logo}
          alt="Logo"
          style={{
            width: logoHeight,
            height: logoHeight,
            borderRadius: 8,
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            ...styles?.normal,
            fontSize: 0.5 * logoHeight,
            fontWeight: "bold",
            alignSelf: "center",
          }}
        >
          {(credential?.issuer ?? credential?.name ?? "C")
            ?.charAt(0)
            .toUpperCase()}
        </div>
      )}
    </div>
  );
}

function CardPrimaryBody({
  credential,
  primaryAttribute,
  secondaryAttribute,
  styles,
}: {
  credential?: LocalizedCredential;
  primaryAttribute?: DisplayAttribute;
  secondaryAttribute?: DisplayAttribute;
  styles?: Record<string, React.CSSProperties>;
}) {
  const displayAttributes = [];
  if (primaryAttribute) {
    displayAttributes.push(primaryAttribute);
  }
  if (secondaryAttribute) {
    displayAttributes.push(secondaryAttribute);
  }

  return (
    <div style={styles?.primaryBodyContainer}>
      <IssuerName issuer={credential?.issuer} styles={styles} />
      <CredentialName name={credential?.name} styles={styles} />
      {displayAttributes.map((attribute, index) => (
        <Attribute
          key={`${attribute.name}_${index}`}
          attribute={attribute}
          styles={styles}
        />
      ))}
    </div>
  );
}

function CardStatus({
  styles,
}: {
  styles?: Record<string, React.CSSProperties>;
}) {
  return <div style={styles?.statusContainer} />;
}

function Card({
  overlay,
  credential,
  language,
  styles,
}: {
  overlay?: OverlayBundle;
  credential?: LocalizedCredential;
  language?: string;
  styles?: Record<string, React.CSSProperties>;
}) {
  const branding = useBranding();
  let primaryAttribute;
  let secondaryAttribute;
  if (branding?.primaryAttribute) {
    primaryAttribute = getOverlayAttribute(branding.primaryAttribute, overlay, credential, language);
  }
  if (branding?.secondaryAttribute) {
    secondaryAttribute = getOverlayAttribute(branding.secondaryAttribute, overlay, credential, language);
  }

  // Resolve watermark text (supports string or localized object)
  let resolvedWatermark: string | undefined = undefined;
  const wmSource: any = branding?.watermarkText;
  if (typeof wmSource === "string") {
    resolvedWatermark = wmSource;
  } else if (wmSource && typeof wmSource === "object") {
    if (language && wmSource[language]) {
      resolvedWatermark = wmSource[language];
    } else {
      const firstValue = Object.values(wmSource)[0];
      if (typeof firstValue === "string") {
        resolvedWatermark = firstValue;
      }
    }
  }

  return (
    <div style={styles?.cardContainer}>
      {/* Optional graphic background if no explicit watermark text */}
      {branding?.backgroundImage && !resolvedWatermark ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${branding.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
            borderTopLeftRadius: borderRadius,
            borderBottomLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
          }}
        />
      ) : null}

      {/* Watermark text layer (repeated diagonally) */}
      {resolvedWatermark ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            transform: "rotate(-25deg)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {/* Repeat the watermark text across the card area */}
          {Array.from({ length: 7 }).map((_, row) => (
            <div
              key={`wmr_${row}`}
              style={{
                display: "flex",
                flexDirection: "row",
                marginVertical: 12,
              }}
            >
              {Array.from({ length: 4 }).map((__, col) => (
                <div
                  key={`wm_${row}_${col}`}
                  style={{
                    color: "#ffffff",
                    opacity: 0.25,
                    fontWeight: "bold",
                    fontSize: 28,
                    letterSpacing: 2,
                    marginHorizontal: 16,
                    textTransform: "uppercase",
                  }}
                >
                  {resolvedWatermark}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <CardSecondaryBody styles={styles} />
      <CardLogo credential={credential} styles={styles} />
      <CardPrimaryBody
        credential={credential}
        primaryAttribute={primaryAttribute}
        secondaryAttribute={secondaryAttribute}
        styles={styles}
      />
      <CardStatus styles={styles} />
    </div>
  );
}

function WebCredentialCard({
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

  // Debug logging
  console.log('WebCredentialCard - branding:', branding);
  console.log('WebCredentialCard - overlay:', overlay);
  console.log('WebCredentialCard - record:', record);

  useMemo(() => {
    if (!(overlay && record)) {
      return;
    }
    setFormatter(new CredentialFormatter(overlay, record));
  }, [overlay, record]);

  const localizedCredential = formatter?.localizedCredential(language ?? "en");

  return (
    <div style={{...styles.container, width}}>
      <Card
        overlay={overlay}
        credential={localizedCredential}
        language={language}
        styles={styles}
      />
    </div>
  );
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

export default WebCredentialCard;