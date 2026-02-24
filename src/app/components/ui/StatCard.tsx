'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  valueColor?: string;
  loading?: boolean;
  footer?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor = 'primary.main',
  valueColor = 'text.primary',
  loading = false,
  footer,
}: StatCardProps) {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="60%" height={40} />
          {footer && <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: 1 }}>
          <Box
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              borderRadius: 2,
              bgcolor: iconBgColor,
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="h4"
          fontWeight={600}
          sx={{
            color: valueColor,
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
        {footer && (
          <Box sx={{ mt: 1.5 }}>
            {footer}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
