'use client';

import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

/**
 * Reusable summary card component for displaying key metrics.
 * Features an icon, title, value, and optional trend indicator.
 *
 * @param title - Card title/label
 * @param value - Main value to display
 * @param icon - Icon element to display
 * @param color - Color for the icon background
 * @param subtitle - Optional subtitle text
 * @param trend - Optional trend direction ('up', 'down', 'neutral')
 * @param trendValue - Optional trend value text (e.g., "+12%")
 */
export function SummaryCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  trendValue,
}: SummaryCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          {trend && trendValue && (
            <Chip
              label={trendValue}
              size="small"
              color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
              sx={{
                height: 24,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {title}
        </Typography>

        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            mb: subtitle ? 1 : 0,
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
