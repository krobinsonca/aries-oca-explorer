import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { StyledEngineProvider } from "@mui/material/styles";
import { ThemeProvider } from '@/app/contexts/Theme';
import { LanguageProvider } from '@/app/contexts/Language';
import ThemeWrapper from '@/app/components/ThemeWrapper';
import ThemeClassProvider from '@/app/components/ThemeClassProvider';
import Header from '@/app/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aries OCA Explorer',
  description: 'Aries OCA Explorer'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <ThemeClassProvider />
            <StyledEngineProvider injectFirst>
              <ThemeWrapper>
                <Header />
                <main className='app min-h-screen' style={{ paddingTop: '64px' }}>
                  {children}
                </main>
              </ThemeWrapper>
            </StyledEngineProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
