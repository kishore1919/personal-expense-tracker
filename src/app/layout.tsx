'use client';

import './globals.css';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import MUIProvider from './components/MUIProvider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { useRouter } from 'next/navigation';
import Loading from './components/Loading';

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

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const isAuthPage = pathname === '/login';
  const { sidebarWidth } = useSidebar();

  React.useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return <Loading />;
  }

  // Prevent showing protected content while redirecting
  if (!user && !isAuthPage) {
    return <Loading />;
  }

  return (
    <>
      {!isAuthPage && user && <Sidebar />}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: (isAuthPage || !user) ? 0 : { xs: 0, md: `${sidebarWidth}px` },
          transition: 'margin-left 200ms ease',
          pb: { xs: '80px', md: 0 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: isAuthPage ? 'center' : 'flex-start',
            alignItems: isAuthPage ? 'center' : 'flex-start',
            p: isAuthPage ? 3 : { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: isAuthPage ? '420px' : '1200px',
              mx: 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${bodyFont.variable} ${headingFont.variable}`}>
        <ThemeProvider>
          <MUIProvider>
            <CurrencyProvider>
              <SidebarProvider>
                <Box
                  sx={{
                    display: 'flex',
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    transition: 'background-color 200ms ease',
                  }}
                >
                  <AppLayout>{children}</AppLayout>
                </Box>
              </SidebarProvider>
            </CurrencyProvider>
          </MUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
