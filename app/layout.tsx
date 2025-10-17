import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import ClientProviders from '@/app/components/ClientProviders';
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
        {/* Skip link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ClientProviders>
          <Header />
          <main id="main-content" className='app min-h-screen' style={{ paddingTop: '64px' }}>
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
