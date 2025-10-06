import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { constructExplorerUrl } from '@/app/lib/data';

interface GroupedIdDisplayProps {
  ids: string[];
  showTitle?: boolean;
  title?: string;
  ledgerNormalized?: string;
}

export default function GroupedIdDisplay({
  ids,
  showTitle = false,
  title = "Associated Identifiers",
  ledgerNormalized
}: GroupedIdDisplayProps) {
  if (!ids || ids.length === 0) {
    return null;
  }

  // Group IDs by type
  const schemaIds = ids.filter(id => !id.includes(':3:CL:'));
  const credDefIds = ids.filter(id => id.includes(':3:CL:'));

  return (
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
      {showTitle && (
        <Typography
          variant="h6"
          sx={{
            fontSize: '16px',
            fontWeight: 500,
            color: '#333',
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}
      {ids.length > 1 ? (
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
              {schemaIds.map((id, index) => {
                const explorerUrl = constructExplorerUrl(id, ledgerNormalized, ids);
                return (
                  <Box key={index} sx={{ mb: index < schemaIds.length - 1 ? 1 : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        flex: 1,
                      }}
                    >
                      {id}
                    </Typography>
                    {explorerUrl && (
                      <Link
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: '9px',
                          color: '#1976d2',
                          textDecoration: 'underline',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            color: '#1565c0',
                          },
                        }}
                      >
                        View →
                      </Link>
                    )}
                  </Box>
                );
              })}
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
              {credDefIds.map((id, index) => {
                const explorerUrl = constructExplorerUrl(id, ledgerNormalized, ids);
                return (
                  <Box key={index} sx={{ mb: index < credDefIds.length - 1 ? 1 : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        flex: 1,
                      }}
                    >
                      {id}
                    </Typography>
                    {explorerUrl && (
                      <Link
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: '9px',
                          color: '#1976d2',
                          textDecoration: 'underline',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            color: '#1565c0',
                          },
                        }}
                      >
                        View →
                      </Link>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
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
            {ids[0].includes(':3:CL:') ? 'Credential Definition ID' : 'Schema ID'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                flex: 1,
              }}
            >
              {ids[0]}
            </Typography>
            {(() => {
              const explorerUrl = constructExplorerUrl(ids[0], ledgerNormalized, ids);
              return explorerUrl ? (
                <Link
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '9px',
                    color: '#1976d2',
                    textDecoration: 'underline',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: '#1565c0',
                    },
                  }}
                >
                  View →
                </Link>
              ) : null;
            })()}
          </Box>
        </>
      )}
    </Box>
  );
}
