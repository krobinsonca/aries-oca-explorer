import React, { CSSProperties, useState, useMemo } from "react";
import { Text, View, Image, ImageBackground } from "react-native";
import { BrandingState, useBranding } from "../contexts/Branding";
import { OverlayBundle } from "@hyperledger/aries-oca";
import { textColorForBackground } from "@hyperledger/aries-oca";
import { CredentialExchangeRecord } from "@aries-framework/core";
import { CredentialFormatter, DisplayAttribute, LocalizedCredential } from "@hyperledger/aries-oca";
import AttributeLabel from "./AttributeLabel";
import AttributeValue from "./AttributeValue";

const width = 360;
const borderRadius = 10;
const padding = width * 0.05;
const logoHeight = width * 0.12;

function computedStyles(branding: BrandingState | null): Record<string, CSSProperties> {
  const backgroundColor = branding?.primaryBackgroundColor || "#003366";
  const textColor = textColorForBackground(backgroundColor);

  return {
    container: {
      backgroundColor: backgroundColor,
      borderRadius: borderRadius,
    },
    cardContainer: {
      flexDirection: "row",
      minHeight: 0.33 * width,
      position: "relative",
    },
     primaryBodyContainer: {
       flexShrink: 1,
       padding,
       margin: -1,
       marginLeft: -1 * logoHeight + padding,
       position: "relative",
       zIndex: 2,
     },
     secondaryBodyContainer: {
       width: logoHeight,
       borderTopLeftRadius: borderRadius,
       borderBottomLeftRadius: borderRadius,
       backgroundColor:
         (branding?.backgroundImageSlice
           ? "rgba(0, 0, 0, 0)"
           : branding?.secondaryBackgroundColor) || "rgba(0, 0, 0, 0.24)",
       position: "relative",
       zIndex: 2,
     },
     logoContainer: {
       top: padding,
       left: -1 * logoHeight + padding,
       width: logoHeight,
       height: logoHeight,
       backgroundColor: "rgba(255, 255, 255, 1)",
       borderRadius: 8,
       justifyContent: "center",
       alignItems: "center",
       position: "relative",
       zIndex: 2,
     },
     statusContainer: {
       backgroundColor: "rgba(0, 0, 0, 0)",
       borderTopRightRadius: borderRadius,
       borderBottomLeftRadius: borderRadius,
       height: logoHeight,
       width: logoHeight,
       justifyContent: "center",
       alignItems: "center",
       position: "relative",
       zIndex: 2,
     },
    textContainer: {
      color: textColor,
      flexShrink: 1,
    },
    attributeContainer: {
      marginTop: 15,
    },
    label: {
      fontSize: 14,
      fontWeight: "bold",
    },
    labelSubtitle: {
      fontSize: 14,
      fontWeight: "normal",
    },
    normal: {
      fontSize: 18,
      fontWeight: "normal",
    },
  };
}

function IssuerName({
  issuer,
  styles,
}: {
  issuer?: string;
  styles?: Record<string, CSSProperties>;
}) {
  return (
    <View>
      <Text
        style={[
          styles?.label,
          styles?.textContainer,
          {
            lineHeight: 19,
            opacity: 0.8,
            flex: 1,
            flexWrap: "wrap",
            color: styles?.textContainer?.color,
          },
        ]}
        numberOfLines={1}
      >
        {issuer}
      </Text>
    </View>
  );
}

function CredentialName({
  name,
  styles,
}: {
  name?: string;
  styles?: Record<string, CSSProperties>;
}) {
  return (
    <View>
      <Text
        style={[
          styles?.normal,
          styles?.textContainer,
          {
            fontWeight: "bold",
            lineHeight: 24,
            flex: 1,
            flexWrap: "wrap",
            color: styles?.textContainer?.color,
          },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}

function Attribute({
  attribute,
  styles,
}: {
  attribute: DisplayAttribute;
  styles?: Record<string, CSSProperties>;
}) {
  return (
    <View style={[styles?.textContainer, styles?.attributeContainer]}>
      <AttributeLabel
        attribute={attribute}
        styles={[
          styles?.labelSubtitle ?? {},
          styles?.textContainer ?? {},
          {
            lineHeight: 19,
            opacity: 0.8,
            color: styles?.textContainer?.color,
          },
        ]}
      />
      {attribute.characterEncoding === "base64" &&
      attribute.format?.includes("image") ? (
        <Image
          source={{
            uri: attribute.value,
            height: logoHeight,
            width: logoHeight,
          }}
          alt="Image"
          style={{
            marginTop: 4,
          }}
        />
      ) : (
        <AttributeValue
          attribute={attribute}
          styles={[
            styles?.normal ?? {},
            styles?.textContainer ?? {},
            {
              lineHeight: 24,
              color: styles?.textContainer?.color,
            } as CSSProperties,
          ]}
        />
      )}
    </View>
  );
}

function CardSecondaryBody({
  styles,
}: {
  overlay?: OverlayBundle;
  styles?: Record<string, CSSProperties>;
}) {
  const branding = useBranding();

  return (
    <View style={[styles?.secondaryBodyContainer]}>
      {branding?.backgroundImageSlice ? (
        <ImageBackground
          source={branding?.backgroundImageSlice}
          style={{ flexGrow: 1 }}
          imageStyle={{
            borderTopLeftRadius: borderRadius,
            borderBottomLeftRadius: borderRadius,
          }}
        />
      ) : null}
    </View>
  );
}

function CardLogo({
  credential,
  styles,
}: {
  credential?: LocalizedCredential;
  styles?: Record<string, CSSProperties>;
}) {
  const branding = useBranding();

  return (
    <View style={[styles?.logoContainer]}>
      {branding?.logo ? (
        <Image
          source={branding?.logo}
          alt="Logo"
          resizeMode="cover"
          style={{
            width: logoHeight,
            height: logoHeight,
            borderRadius: 8,
          }}
        />
      ) : (
        <Text
          style={[
            styles?.normal,
            {
              fontSize: 0.5 * logoHeight,
              fontWeight: "bold",
              alignSelf: "center",
            },
          ]}
        >
          {(credential?.issuer ?? credential?.name ?? "C")
            ?.charAt(0)
            .toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function getLocalizedValue(value: any, language?: string): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (language && typeof value === 'object' && value[language]) return value[language];
  if (typeof value === 'object') {
    const first = Object.values(value).find((v) => typeof v === 'string' && v.trim());
    if (typeof first === 'string') return first;
  }
  return undefined;
}

function CardPrimaryBody({
  overlay,
  language,
  credential,
  primaryAttribute,
  secondaryAttribute,
  styles,
}: {
  overlay?: OverlayBundle;
  language?: string;
  credential?: LocalizedCredential;
  primaryAttribute?: DisplayAttribute;
  secondaryAttribute?: DisplayAttribute;
  styles?: Record<string, CSSProperties>;
}) {
  const displayAttributes = [];
  if (primaryAttribute) {
    displayAttributes.push(primaryAttribute);
  }
  if (secondaryAttribute) {
    displayAttributes.push(secondaryAttribute);
  }

  const issuerText = credential?.issuer || getLocalizedValue((overlay as any)?.metadata?.issuer, language);
  const nameText = credential?.name || getLocalizedValue((overlay as any)?.metadata?.name, language);

  return (
    <View style={styles?.primaryBodyContainer}>
      <IssuerName issuer={issuerText} styles={styles} />
      <CredentialName name={nameText} styles={styles} />
      {displayAttributes.map((attribute, index) => (
        <Attribute
          key={`${attribute.name}_${index}`}
          attribute={attribute}
          styles={styles}
        />
      ))}
    </View>
  );
}

function CardStatus({ styles }: { styles?: Record<string, CSSProperties> }) {
  return <View style={[styles?.statusContainer]} />;
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
  styles?: Record<string, CSSProperties>;
}) {
  const branding = useBranding();

  let primaryAttribute;
  let secondaryAttribute;
  if (branding?.primaryAttribute) {
    primaryAttribute = getOverlayAttribute(
      branding.primaryAttribute,
      overlay,
      credential,
      language
    );
  }
  if (branding?.secondaryAttribute) {
    secondaryAttribute = getOverlayAttribute(
      branding.secondaryAttribute,
      overlay,
      credential,
      language
    );
  }

  // Resolve watermark text (supports string or localized object)
  let resolvedWatermark: string | undefined = undefined;
  const wmSource: any = branding?.watermarkText;

  if (typeof wmSource === "string" && wmSource.trim()) {
    resolvedWatermark = wmSource;
  } else if (wmSource && typeof wmSource === "object") {
    if (language && wmSource[language] && typeof wmSource[language] === "string" && wmSource[language].trim()) {
      resolvedWatermark = wmSource[language];
    } else {
      const firstValue = Object.values(wmSource).find(v => typeof v === "string" && v.trim());
      if (firstValue) {
        resolvedWatermark = firstValue as string;
      }
    }
  }

  // Only show watermark if we have valid text
  if (!resolvedWatermark || !resolvedWatermark.trim()) {
    resolvedWatermark = undefined;
  }

  return (
    <View style={styles?.cardContainer}>

      {/* Watermark overlay */}
      {resolvedWatermark ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* Dense 20x20 watermark grid */}
          {Array.from({ length: 20 }).map((_, row) => (
            <View
              key={`wmr_${row}`}
              style={{
                flexDirection: "row",
                marginVertical: 0,
                transform: "rotate(-25deg)",
              }}
            >
              {Array.from({ length: 20 }).map((__, col) => (
                <Text
                  key={`wm_${row}_${col}`}
                  style={{
                    color: "#ffffff",
                    opacity: 0.1,
                    fontWeight: "bold",
                    fontSize: 16,
                    letterSpacing: 0.5,
                    marginHorizontal: 8,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  {resolvedWatermark}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <CardSecondaryBody styles={styles} />
      <CardLogo credential={credential} styles={styles} />
      <CardPrimaryBody
        overlay={overlay}
        language={language}
        credential={credential}
        primaryAttribute={primaryAttribute}
        secondaryAttribute={secondaryAttribute}
        styles={styles}
      />
      <CardStatus styles={styles} />
    </View>
  );
}

function CredentialCard({
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
    <View style={[styles.container, { width }]}>
      <Card
        overlay={overlay}
        credential={localizedCredential}
        language={language}
        styles={styles}
      />
    </View>
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

export default CredentialCard;