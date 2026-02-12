'use client';

import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import { FaBook } from 'react-icons/fa';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        width: '100%',
        gap: 3
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Background Track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={80}
          thickness={2}
          sx={{
            color: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
          }}
        />
        {/* Spinning Loader */}
        <CircularProgress
          variant="indeterminate"
          size={80}
          thickness={2}
          sx={{
            color: 'primary.main',
            position: 'absolute',
            left: 0,
            animationDuration: '1.5s',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        {/* Pulsing Logo */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${pulse} 2s infinite ease-in-out`,
            color: 'primary.main',
          }}
        >
          <FaBook size={32} />
        </Box>
      </Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          color: 'text.secondary',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          animation: `${pulse} 2s infinite ease-in-out`,
        }}
      >
        Expense Pilot
      </Typography>
    </Box>
  );
}
