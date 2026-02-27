'use client';

import React from 'react';
import { Typography, Button, Card, CardContent } from '@mui/material';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          color="text.secondary" 
          gutterBottom
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 1, sm: 0 },
          }}
        >
          {message}
        </Typography>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outlined"
            fullWidth
            sx={{
              mt: 2,
              px: { xs: 3, sm: 4 },
              minWidth: { xs: '100%', sm: 'auto' },
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface NoResultsStateProps {
  onClear: () => void;
}

export function NoResultsState({ onClear }: NoResultsStateProps) {
  return (
    <Card sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          color="text.secondary" 
          gutterBottom
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 1, sm: 0 },
          }}
        >
          No books match your search.
        </Typography>
        <Button
          onClick={onClear}
          variant="outlined"
          fullWidth
          sx={{
            mt: 2,
            px: { xs: 3, sm: 4 },
            minWidth: { xs: '100%', sm: 'auto' },
            display: { sm: 'inline-block' },
            width: { sm: 'auto' },
          }}
        >
          Clear search
        </Button>
      </CardContent>
    </Card>
  );
}
