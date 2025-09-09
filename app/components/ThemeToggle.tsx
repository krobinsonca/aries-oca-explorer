'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../contexts/Theme';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        aria-pressed={mode === 'dark'}
        role="switch"
        sx={{
          ml: 1,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:focus': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        }}
      >
        {mode === 'light' ? <DarkMode aria-hidden="true" /> : <LightMode aria-hidden="true" />}
      </IconButton>
    </Tooltip>
  );
}