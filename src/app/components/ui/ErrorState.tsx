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
    <Card sx={{ textAlign: 'center', py: 6 }}>
      <CardContent>
        <Typography color="text.secondary" gutterBottom>
          {message}
        </Typography>
        {onRetry && (
          <Button onClick={onRetry} variant="outlined" sx={{ mt: 2 }}>
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
    <Card sx={{ textAlign: 'center', py: 6 }}>
      <CardContent>
        <Typography color="text.secondary" gutterBottom>
          No books match your search.
        </Typography>
        <Button onClick={onClear} variant="outlined">
          Clear search
        </Button>
      </CardContent>
    </Card>
  );
}
