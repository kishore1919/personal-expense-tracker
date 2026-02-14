/**
 * ProtectedLayout Component - Layout wrapper for route protection.
 * Handles authentication state and renders appropriate layout:
 * - Loading state while checking auth
 * - Sidebar + main content for authenticated users
 * - Centered content for auth pages (login)
 */
'use client';

import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { useSidebar } from '@/app/context/SidebarContext';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import Loading from './Loading';
import Sidebar from './Sidebar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';
  const { sidebarWidth } = useSidebar();
  const { loading, isAuthenticated } = useProtectedRoute();

  // Show loading while checking auth or redirecting
  if (loading || (!isAuthenticated && !isAuthPage)) {
    return <Loading />;
  }

  // Don't render protected layout for auth pages
  if (isAuthPage) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '420px', mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: 'margin-left 200ms ease',
          pb: { xs: '80px', md: 0 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}
