'use client';

import { TextField, InputAdornment } from '@mui/material';
import { FiSearch } from 'react-icons/fi';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  width?: string | number | object;
  size?: 'small' | 'medium';
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  fullWidth = false,
  width = { xs: '100%', sm: 280 },
  size = 'small',
}: SearchInputProps) {
  return (
    <TextField
      placeholder={placeholder}
      size={size}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FiSearch />
          </InputAdornment>
        ),
      }}
      sx={{ width }}
    />
  );
}
