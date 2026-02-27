/**
 * LoginPage Component - Authentication page with Google sign-in.
 * Provides Google OAuth login for user authentication.
 * Redirects authenticated users to the home page.
 */
'use client';

import { useState, useCallback } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { FaBook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Button, Typography, Box, Alert, Card, CardContent } from '@mui/material';
import { usePublicRoute } from '../hooks/useAuth';
import Loading from '../components/Loading';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
};

function getErrorMessage(code: string | undefined): string {
  if (!code) return 'Failed to sign in. Please try again.';
  return AUTH_ERROR_MESSAGES[code] || 'Failed to sign in with Google. Please try again.';
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loading } = usePublicRoute();

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      // Router redirect is handled by usePublicRoute hook
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      const message = getErrorMessage(fbErr?.code);
      if (message) {
        setError(message);
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Card 
        sx={{ 
          width: '100%', 
          maxWidth: 440,
          borderRadius: 3,
          boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.1)', sm: '0 4px 16px rgba(0,0,0,0.12)' },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
          {/* Logo and Title */}
          <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Box
              sx={{
                mx: 'auto',
                mb: { xs: 2, sm: 3 },
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaBook size={24} />
            </Box>
            <Typography 
              variant="h4" 
              fontWeight={600} 
              sx={{ 
                mb: { xs: 1, sm: 1.5 },
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              }}
            >
              Expense Pilot
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.5,
              }}
            >
              Sign in to manage your expenses.
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            startIcon={<FcGoogle size={24} />}
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              borderColor: 'divider',
              color: 'text.primary',
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              fontWeight: 600,
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          <Box sx={{ mt: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                lineHeight: 1.5,
              }}
            >
              By signing in, you agree to our Terms of Service.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
