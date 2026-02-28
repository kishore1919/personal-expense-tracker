/**
 * loading.tsx - Next.js loading UI for page navigation.
 * Displays a loading spinner while the next page loads.
 */
'use client';

import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { FaBook } from 'react-icons/fa';

// Floating animation for the book icon
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// Gradient rotation
const gradientSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Fade in
const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// Dot bounce
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0; }
  40% { transform: scale(1); opacity: 1; }
`;

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        gap: 4,
        px: 2,
      }}
    >
      {/* Animated Logo Container */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Gradient Ring */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
            backgroundSize: '300% 300%',
            animation: `${gradientSpin} 3s linear infinite`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'blur(8px)',
            opacity: 0.6,
          }}
        />

        {/* Inner Circle */}
        <Box
          sx={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 50, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 0 40px rgba(99, 102, 241, 0.3)'
              : '0 0 40px rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Floating Book Icon */}
          <Box
            sx={{
              color: 'primary.main',
              animation: `${float} 2s ease-in-out infinite`,
            }}
          >
            <FaBook size={40} />
          </Box>
        </Box>
      </Box>

      {/* Text Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          animation: `${fadeIn} 0.6s ease-out 0.2s both`,
        }}
      >
        {/* Loading Text with Dots */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          Loading
          {/* Animated Dots */}
          <Box sx={{ display: 'flex', gap: 0.3 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: `${bounce} 1.4s infinite ease-in-out`,
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </Box>
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            textAlign: 'center',
          }}
        >
          Setting up your expense tracker
        </Typography>
      </Box>
    </Box>
  );
}
