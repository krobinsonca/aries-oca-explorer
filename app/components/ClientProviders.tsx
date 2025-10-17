'use client';

import { StyledEngineProvider } from "@mui/material/styles";
import { ThemeProvider } from '@/app/contexts/Theme';
import { LanguageProvider } from '@/app/contexts/Language';
import ThemeWrapper from '@/app/components/ThemeWrapper';
import ThemeClassProvider from '@/app/components/ThemeClassProvider';

export default function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemeClassProvider />
        <StyledEngineProvider injectFirst>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </StyledEngineProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}