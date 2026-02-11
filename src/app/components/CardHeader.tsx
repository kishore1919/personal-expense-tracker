'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import { IconType } from 'react-icons';

type TitleVariant = 'h4' | 'h5' | 'h6';

interface CardHeaderProps {
  icon: IconType;
  title: string;
  variant?: TitleVariant;
  iconColor?: string;
  sx?: SxProps<Theme>;
}

export default function CardHeader({
  icon: Icon,
  title,
  variant = 'h5',
  iconColor = 'primary.main',
  sx = {},
}: CardHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 3,
        ...sx,
      }}
    >
      <Box sx={{ color: iconColor }}>
        <Icon size={24} />
      </Box>
      <Typography variant={variant} fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
}
