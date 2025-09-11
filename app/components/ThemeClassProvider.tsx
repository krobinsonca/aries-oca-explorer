'use client';

import React, { useEffect } from 'react';
import { useTheme } from '@/app/contexts/Theme';

export default function ThemeClassProvider() {
  const { mode } = useTheme();

  useEffect(() => {
    // Apply theme class to body for CSS styling
    document.body.className = mode;
  }, [mode]);

  return null;
}