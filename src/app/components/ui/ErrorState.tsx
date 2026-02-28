'use client';

import React from 'react';
import { Typography, Button, Card, CardContent, Alert, AlertTitle } from '@mui/material';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Standard error state component for full-page errors.
 * Displays an error message with an optional retry button.
 */
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

export interface NoResultsStateProps {
  onClear: () => void;
  message?: string;
}

/**
 * No results state component for empty search results.
 */
export function NoResultsState({
  onClear,
  message = 'No books match your search.',
}: NoResultsStateProps) {
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

export interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  variant?: 'inline' | 'banner' | 'card';
  title?: string;
}

/**
 * Flexible error display component with multiple variants.
 * Use 'inline' for form errors, 'banner' for page-level errors, 'card' for isolated errors.
 */
export function ErrorDisplay({
  error,
  onRetry,
  variant = 'inline',
  title,
}: ErrorDisplayProps) {
  if (!error) return null;

  if (variant === 'inline') {
    return (
      <Alert severity="error" action={onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      )}>
        {error}
      </Alert>
    );
  }

  if (variant === 'banner') {
    return (
      <Alert
        severity="error"
        variant="filled"
        sx={{ mb: 3 }}
        action={onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {error}
      </Alert>
    );
  }

  // Card variant
  return <ErrorState message={error} onRetry={onRetry} />;
}
