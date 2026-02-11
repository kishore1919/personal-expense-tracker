'use client';

import React from 'react';
import { Card, CardContent, Typography, Button, Box, SxProps, Theme } from '@mui/material';
import { IconType } from 'react-icons';
import IconBox from './IconBox';

type EmptyStateVariant = 'dashed' | 'solid';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyStateVariant;
  iconColor?: string;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  sx?: SxProps<Theme>;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'dashed',
  iconColor = 'primary',
  iconSize = 'xl',
  sx = {},
}: EmptyStateProps) {
  const isDashed = variant === 'dashed';

  return (
    <Card
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
        border: isDashed ? '2px dashed' : undefined,
        borderColor: isDashed ? 'divider' : undefined,
        bgcolor: isDashed ? 'transparent' : undefined,
        ...sx,
      }}
    >
      <CardContent>
        <IconBox
          icon={icon}
          size={iconSize}
          color={iconColor}
          variant="rounded"
          sx={{ mx: 'auto', mb: 3 }}
        />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {description}
        </Typography>
        {actionLabel && onAction && (
          <Button variant="contained" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
