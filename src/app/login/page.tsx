'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { FaBook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Button, Typography, Box, Alert, Card, CardContent } from '@mui/material';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (err: unknown) {
      const fbErr = err as { code?: string } | undefined;
      if (fbErr?.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error
      } else {
        setError('Failed to sign in with Google. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 420,
        mx: 'auto',
        borderRadius: 3,
      }}
    >
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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
