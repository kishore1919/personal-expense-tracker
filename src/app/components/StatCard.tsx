'use client';

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { IconType } from 'react-icons';
import IconBox from './IconBox';

type StatCardColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | string;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  color?: StatCardColor;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  sx?: React.ComponentProps<typeof Card>['sx'];
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  iconSize = 'lg',
  subtitle,
  sx = {},
}: StatCardProps) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: 3 }}>
        <IconBox
          icon={icon}
          size={iconSize}
          color={color}
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
