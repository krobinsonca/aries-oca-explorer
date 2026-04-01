'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { Science, ScienceOutlined } from '@mui/icons-material';
import DevPanel from './DevPanel';
import DevModeIndicator from './DevModeIndicator';
import { useBundleUrl } from '@/app/contexts/BundleUrl';

export default function DevPanelButton() {
  const [open, setOpen] = useState(false);
  const { isProduction } = useBundleUrl();

  return (
    <>
      <Tooltip title="Developer Settings">
        <IconButton
          onClick={() => setOpen(true)}
          color="inherit"
          aria-label="Open developer settings"
          sx={{
            ml: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Badge
            badgeContent={<DevModeIndicator compact />}
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 3,
                minWidth: 16,
                height: 16,
              },
            }}
          >
            {isProduction ? <ScienceOutlined aria-hidden="true" /> : <Science aria-hidden="true" />}
          </Badge>
        </IconButton>
      </Tooltip>
      <DevPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
