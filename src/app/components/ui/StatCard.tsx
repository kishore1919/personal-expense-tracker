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
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor = 'primary.main',
  valueColor = 'text.primary',
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="60%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: iconBgColor,
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight={600} sx={{ color: valueColor }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
