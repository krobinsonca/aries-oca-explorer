import React, { useState } from 'react';
import { Box, Typography, Link, Tooltip, IconButton, useTheme } from '@mui/material';
import { constructExplorerUrl } from '@/app/lib/data';

interface IdLedgerInfo {
  ledger: string;
  ledgerUrl?: string;
  ledgerNormalized: string;
}

interface GroupedIdDisplayProps {
  ids: string[];
  showTitle?: boolean;
  title?: string;
  ledgerNormalized?: string;
  // Per-ID ledger mapping for correct explorer URLs in multi-ledger bundles
  idLedgerMap?: Record<string, IdLedgerInfo>;
  // Optional max width to constrain the display (e.g., to match card width)
  maxWidth?: number | string;
}

// Helper to get the ledger normalized value for a specific ID
function getIdLedgerNormalized(id: string, idLedgerMap?: Record<string, IdLedgerInfo>, fallbackLedgerNormalized?: string): string | undefined {
  if (idLedgerMap && idLedgerMap[id]) {
    return idLedgerMap[id].ledgerNormalized;
  }
  return fallbackLedgerNormalized;
}

// Truncate long ID for display, showing first and last portions
function truncateId(id: string, maxLength: number = 40): string {
  if (id.length <= maxLength) return id;
  const half = Math.floor((maxLength - 3) / 2);
  return `${id.slice(0, half)}...${id.slice(-half)}`;
}

// Copy icon SVG
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.75 1.5C4.94 1.5 4.27 1.88 3.77 2.38L2.38 3.77C1.88 4.27 1.5 4.94 1.5 5.75V12.5C1.5 13.33 2.17 14 3 14H9.75C10.58 14 11.25 13.33 11.25 12.5V11.62L13.62 9.25C14.12 8.75 14.5 8.08 14.5 7.25V3C14.5 1.88 13.62 1 12.5 1H5.75ZM4.25 3.25L5.75 4.75L4.25 6.25L3 5V3.25H4.25ZM12 12H5V5.5L6.25 6.75L7.75 5.25L12 9.5V12Z" fill="currentColor"/>
  </svg>
);

// Checkmark icon SVG
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 4.5L6 12L2.5 8.5L3.5 7.5L6 10L12.5 3.5L13.5 4.5Z" fill="currentColor"/>
  </svg>
);

// External link icon SVG
const ExternalLinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Single ID row component to reduce duplication
function IdRow({
  id,
  idLedgerNormalized,
  ledgerNormalized,
  idLedgerMap,
  theme,
  showCopy = true,
}: {
  id: string;
  idLedgerNormalized: string | undefined;
  ledgerNormalized: string | undefined;
  idLedgerMap?: Record<string, IdLedgerInfo>;
  theme: any;
  showCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const resolvedLedger = idLedgerNormalized ?? ledgerNormalized;
  const explorerUrl = constructExplorerUrl(id, resolvedLedger, [id]);
  const { palette } = theme;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={id} arrow placement="top">
        <Typography
          variant="caption"
          sx={{
            fontSize: '11px',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            color: palette.text.secondary,
            wordBreak: 'keep-all',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            flex: 1,
            backgroundColor: palette.action.hover,
            padding: '5px 10px',
            borderRadius: '6px',
            border: `1px solid ${palette.divider}`,
            cursor: 'default',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: palette.action.selected,
            },
          }}
        >
          {truncateId(id)}
        </Typography>
      </Tooltip>

      {showCopy && (
        <Tooltip title={copied ? 'Copied!' : 'Copy ID'} arrow placement="top">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleCopy();
            }}
            sx={{
              padding: '4px',
              borderRadius: '4px',
              color: copied ? 'success.main' : palette.primary.main,
              backgroundColor: copied ? `${palette.success.main}15` : 'transparent',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: copied ? 'success.dark' : 'primary.dark',
                backgroundColor: copied ? `${palette.success.main}25` : palette.action.hover,
              },
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </Tooltip>
      )}

      {explorerUrl && (
        <Link
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontSize: '10px',
            color: palette.text.secondary,
            fontWeight: 500,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            '&:hover': {
              color: palette.text.primary,
              backgroundColor: palette.action.hover,
            },
          }}
        >
          View
          <ExternalLinkIcon />
        </Link>
      )}
    </Box>
  );
}

export default function GroupedIdDisplay({
  ids,
  showTitle = false,
  title = "Associated Identifiers",
  ledgerNormalized,
  idLedgerMap,
  maxWidth
}: GroupedIdDisplayProps) {
  const theme = useTheme();
  const { palette } = theme;

  if (!ids || ids.length === 0) {
    return null;
  }

  // Group IDs by type
  const schemaIds = ids.filter(id => !id.includes(':3:CL:'));
  const credDefIds = ids.filter(id => id.includes(':3:CL:'));

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        maxWidth: maxWidth,
        backgroundColor: palette.action.hover,
        backdropFilter: 'blur(8px)',
        borderRadius: 2,
        border: `1px solid ${palette.divider}`,
      }}
    >
      {showTitle && (
        <Typography
          variant="h6"
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: palette.text.secondary,
            mb: 1.5,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </Typography>
      )}

      {ids.length > 1 ? (
        <>
          {schemaIds.length > 0 && (
            <Box sx={{ mb: credDefIds.length > 0 ? 1.5 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '4px',
                    backgroundColor: palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '10px', color: palette.primary.contrastText, fontWeight: 600 }}>S</Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {schemaIds.length > 1 ? 'Schema IDs' : 'Schema ID'}
                </Typography>
              </Box>
              {schemaIds.map((id, index) => {
                const idLedgerNormalized = getIdLedgerNormalized(id, idLedgerMap, ledgerNormalized);
                return (
                  <Box key={index} sx={{ mb: index < schemaIds.length - 1 ? 0.75 : 0 }}>
                    <IdRow
                      id={id}
                      idLedgerNormalized={idLedgerNormalized}
                      ledgerNormalized={ledgerNormalized}
                      idLedgerMap={idLedgerMap}
                      theme={theme}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
          {credDefIds.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '4px',
                    backgroundColor: palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '10px', color: palette.primary.contrastText, fontWeight: 600 }}>C</Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {credDefIds.length > 1 ? 'Credential Definition IDs' : 'Credential Definition ID'}
                </Typography>
              </Box>
              {credDefIds.map((id, index) => {
                const idLedgerNormalized = getIdLedgerNormalized(id, idLedgerMap, ledgerNormalized);
                return (
                  <Box key={index} sx={{ mb: index < credDefIds.length - 1 ? 0.75 : 0 }}>
                    <IdRow
                      id={id}
                      idLedgerNormalized={idLedgerNormalized}
                      ledgerNormalized={ledgerNormalized}
                      idLedgerMap={idLedgerMap}
                      theme={theme}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                backgroundColor: palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: '10px', color: palette.primary.contrastText, fontWeight: 600 }}>
                {ids[0].includes(':3:CL:') ? 'C' : 'S'}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '10px',
                fontWeight: 500,
                color: palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {ids[0].includes(':3:CL:') ? 'Credential Definition ID' : 'Schema ID'}
            </Typography>
          </Box>
          <IdRow
            id={ids[0]}
            idLedgerNormalized={getIdLedgerNormalized(ids[0], idLedgerMap, ledgerNormalized)}
            ledgerNormalized={ledgerNormalized}
            idLedgerMap={idLedgerMap}
            theme={theme}
          />
        </>
      )}
    </Box>
  );
}