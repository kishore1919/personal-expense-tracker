'use client';

import React, { Component, ReactNode, useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, IconButton } from '@mui/material';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React rendering errors.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * @example
 * <ErrorBoundary onError={(error) => logError(error)}>
 *   <Dashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (could be extended to send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card
          sx={{
            m: 2,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'error.lighter',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FiAlertTriangle size={24} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" color="error.main" gutterBottom>
                  Something went wrong
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: '0.875rem' }}
                >
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Typography>
                <Button
                  onClick={this.handleReset}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Try Again
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary alternative for functional components.
 * Returns error state and reset function.
 *
 * @example
 * function MyComponent() {
 *   const { error, resetError } = useErrorBoundary();
 *
 *   if (error) {
 *     return <ErrorDisplay error={error.message} onRetry={resetError} />;
 *   }
 *
 *   return <Content />;
 * }
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setError(event.error);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const resetError = () => setError(null);

  return { error, resetError };
}

/**
 * Global error handler component that wraps the app.
 * Catches unhandled errors and displays a user-friendly message.
 */
export function GlobalErrorHandler({ children }: { children: ReactNode }) {
  const { error, resetError } = useErrorBoundary();

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            border: '1px solid',
            borderColor: 'error.light',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FiAlertTriangle size={28} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" color="error.main" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, fontSize: '0.9375rem' }}
                >
                  {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="contained"
                    color="error"
                    size="medium"
                  >
                    Refresh Page
                  </Button>
                  <Button
                    onClick={resetError}
                    variant="outlined"
                    color="inherit"
                    size="medium"
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
