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
        py: 8,
        px: 3,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <CardContent>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <FaBook size={32} />
        </Box>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
        <Button
          variant="contained"
          onClick={onCreate}
          startIcon={<FiPlus />}
          size="large"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
