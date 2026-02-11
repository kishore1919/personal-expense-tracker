'use client';

import React from 'react';
import { TextField, InputAdornment, SxProps, Theme } from '@mui/material';
import { FiSearch } from 'react-icons/fi';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  fullWidth = true,
  size = 'small',
  sx = {},
}: SearchInputProps) {
  return (
    <TextField
      placeholder={placeholder}
      size={size}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white',
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FiSearch color="#888" />
          </InputAdornment>
        ),
      }}
    />
  );
}
