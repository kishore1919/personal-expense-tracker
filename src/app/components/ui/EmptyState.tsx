'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import { FiPlus } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';

interface EmptyStateProps {
  onCreate: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function EmptyState({
  onCreate,
  title = 'No expense books yet',
  description = 'Create your first book to organize expenses by goal, trip, or monthly budget.',
  buttonText = 'Create Your First Book',
}: EmptyStateProps) {
  return (
    <Card
      sx={{
        textAlign: 'center',
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3 },
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <CardContent>
        <Box
          sx={{
            width: { xs: 64, sm: 72, md: 80 },
            height: { xs: 64, sm: 72, md: 80 },
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: { xs: 2, sm: 3 },
          }}
        >
          <FaBook size={28} />
        </Box>
        <Typography 
          variant="h5" 
          gutterBottom 
          fontWeight={600}
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
            px: { xs: 1, sm: 0 },
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: { xs: 3, sm: 4 }, 
            maxWidth: 400, 
            mx: 'auto',
            px: { xs: 2, sm: 0 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          onClick={onCreate}
          startIcon={<FiPlus />}
          size="large"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: { xs: 4, sm: 5 },
            py: { xs: 1.5, sm: 1.75 },
            borderRadius: 2.5,
            fontSize: { xs: '0.9375rem', sm: '1rem' },
            width: { xs: '100%', sm: 'auto' },
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
              bgcolor: 'primary.dark',
            },
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
