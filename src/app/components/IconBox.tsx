'use client';

import React from 'react';
import { Box } from '@mui/material';
import { IconType } from 'react-icons';

type IconBoxSize = 'sm' | 'md' | 'lg' | 'xl';
type IconBoxVariant = 'rounded' | 'circular';
type IconBoxColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | string;

interface IconBoxProps {
  icon: IconType;
  size?: IconBoxSize;
  iconSize?: number;
  color?: IconBoxColor;
  variant?: IconBoxVariant;
  sx?: React.ComponentProps<typeof Box>['sx'];
}

const sizeMap: Record<IconBoxSize, { container: number; icon: number }> = {
  sm: { container: 32, icon: 16 },
  md: { container: 40, icon: 20 },
  lg: { container: 48, icon: 24 },
  xl: { container: 64, icon: 32 },
};

const getColorSx = (color: IconBoxColor) => {
  const paletteColors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
  
  if (paletteColors.includes(color)) {
    return {
      bgcolor: `${color}.main`,
      color: `${color}.contrastText`,
    };
  }
  
  return {
    bgcolor: color,
    color: 'white',
  };
};

export default function IconBox({
  icon: Icon,
  size = 'lg',
  iconSize,
  color = 'primary',
  variant = 'rounded',
  sx = {},
}: IconBoxProps) {
  const dimensions = sizeMap[size];
  const colorSx = getColorSx(color);
  const borderRadius = variant === 'circular' ? '50%' : 2;

  return (
    <Box
      sx={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...colorSx,
        ...sx,
      }}
    >
      <Icon size={iconSize || dimensions.icon} />
    </Box>
  );
}
