'use client';

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

type PageHeaderVariant = 'card' | 'plain';
type TitleVariant = 'h3' | 'h4' | 'h5';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: PageHeaderVariant;
  titleVariant?: TitleVariant;
  action?: React.ReactNode;
  sx?: React.ComponentProps<typeof Box>['sx'];
}

export default function PageHeader({
  title,
  subtitle,
  variant = 'plain',
  titleVariant = 'h4',
  action,
  sx = {},
}: PageHeaderProps) {
  const content = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Typography variant={titleVariant} fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {action && <Box>{action}</Box>}
      </Box>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </>
  );

  if (variant === 'card') {
    return (
      <Box sx={{ mb: 4, ...sx }}>
        <Card>
          <CardContent>{content}</CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4, ...sx }}>
      {content}
    </Box>
  );
}
