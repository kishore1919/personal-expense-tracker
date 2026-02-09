'use client';

import './globals.css';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Manrope, Space_Grotesk } from 'next/font/google';
import Sidebar from './components/Sidebar';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <ThemeProvider>
          <CurrencyProvider>
            <div className="min-h-screen">
              {!isAuthPage && <Sidebar />}
              <main
                className={
                  isAuthPage
                    ? 'flex min-h-screen items-center justify-center px-4 py-12'
                    : 'min-h-screen px-4 pb-24 pt-6 md:ml-72 md:px-10 md:pb-10 md:pt-8'
                }
              >
                <div className={isAuthPage ? 'w-full max-w-md fade-in' : 'mx-auto w-full max-w-6xl fade-in'}>
                  {children}
                </div>
              </main>
            </div>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
