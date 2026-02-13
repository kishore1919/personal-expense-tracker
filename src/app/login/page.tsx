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
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Logo and Title */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 2,
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaBook size={28} />
          </Box>
          <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
            Expense Pilot
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to manage your expenses.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          startIcon={<FcGoogle />}
          sx={{
            py: 1.5,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'action.hover',
            },
          }}
        >
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            By signing in, you agree to our Terms of Service.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
