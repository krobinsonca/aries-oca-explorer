'use client';

import React from 'react';
import { Chip, Tooltip, Link } from '@mui/material';
import { Science } from '@mui/icons-material';
import { useBundleUrl } from '@/app/contexts/BundleUrl';

interface DevModeIndicatorProps {
  compact?: boolean;
}

export default function DevModeIndicator({ compact = false }: DevModeIndicatorProps) {
  const { env, bundleUrl, isProduction } = useBundleUrl();

  if (isProduction) {
    return null;
  }

  const label = env === 'test' ? 'TEST MODE' : 'CUSTOM';
  const tooltipTitle = env === 'test' 
    ? 'Using test bundle data' 
    : `Using custom bundle: ${bundleUrl}`;

  return (
    <Tooltip title={tooltipTitle} arrow placement="bottom">
      <Chip
        icon={<Science sx={{ fontSize: '16px !important' }} />}
        label={compact ? '' : label}
        size="small"
        color={env === 'test' ? 'warning' : 'error'}
        sx={{
          height: compact ? 24 : 28,
          fontWeight: 600,
          fontSize: compact ? 10 : 11,
          '& .MuiChip-icon': {
            fontSize: '16px',
          },
        }}
      />
    </Tooltip>
  );
}
