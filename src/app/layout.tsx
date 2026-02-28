/**
 * RootLayout Component - Main application layout.
 * Wraps all pages with providers for theme, currency, sidebar, and authentication.
 * Configures fonts, metadata, and global styles.
 */
import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Box } from '@mui/material';
import MUIProvider from './components/MUIProvider';
import { ProtectedLayout } from './components/ProtectedLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import './globals.css';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Expense Pilot - Personal Expense Tracker',
  description: 'Track and manage your personal expenses efficiently',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${bodyFont.variable} ${headingFont.variable} antialiased`}
      >
        <ErrorBoundary>
          <MUIProvider>
            <Box
              sx={{
                display: 'flex',
                minHeight: '100vh',
                backgroundColor: 'background.default',
                transition: 'background-color 200ms ease',
              }}
            >
              <ProtectedLayout>{children}</ProtectedLayout>
            </Box>
          </MUIProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
