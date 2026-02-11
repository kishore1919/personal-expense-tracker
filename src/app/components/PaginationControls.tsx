'use client';

import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl, IconButton, SxProps, Theme, SelectChangeEvent } from '@mui/material';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  sx?: SxProps<Theme>;
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  sx = {},
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(Number(event.target.value));
    onPageChange(1);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 2,
        gap: 1,
        ...sx,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {totalItems === 0 ? 0 : startIndex} - {endIndex} of {totalItems}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Select
          size="small"
          value={page}
          onChange={(e) => onPageChange(Number(e.target.value))}
          sx={{ minWidth: 60 }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2">of {totalPages}</Typography>
        <IconButton
          size="small"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <FiChevronLeft />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <FiChevronRight />
        </IconButton>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select value={pageSize} onChange={handlePageSizeChange}>
            {pageSizeOptions.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
