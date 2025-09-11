'use client';

import { createTheme, ThemeOptions } from "@mui/material/styles";

const baseTheme: ThemeOptions = {
  palette: {
    primary: {
      light: "#3E5C93",
      main: "#003366",
      dark: "#000C3A",
    },
    secondary: {
      light: "#FFF263",
      main: "#FBC02D",
      dark: "#C49000",
    },
    success: { main: "#2E8540" },
    error: { main: "#FF3E34" },
    warning: { main: "#FE7921" },
    contrastThreshold: 3,
    tonalOffset: 0.1,
  },
  typography: {
    fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
    button: {
      textTransform: "none",
    },
    h1: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"BC Sans", "Noto Sans", "Verdana", "Arial", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1080, // Default: 960
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 14,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a', // Improved contrast ratio
      secondary: '#4a4a4a', // Improved contrast ratio
    },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0', // Improved contrast ratio
    },
  },
});

// Default theme (dark mode)
export const theme = darkTheme;
