'use client';

import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

/**
 * Reusable pagination component with navigation controls.
 * Displays current page, total pages, and navigation buttons.
 *
 * @param page - Current page number (1-indexed)
 * @param totalPages - Total number of pages
 * @param onPageChange - Callback when page changes
 * @param totalItems - Optional total item count for display
 * @param pageSize - Optional page size for display
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIndex = (page - 1) * (pageSize || 10) + 1;
  const endIndex = Math.min(page * (pageSize || 10), totalItems || 0);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mt: 3,
        pb: 2,
      }}
    >
      {totalItems && pageSize && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Showing {startIndex} to {endIndex} of {totalItems} results
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          size="small"
          sx={{ minWidth: 36 }}
        >
          <FiChevronLeft size={18} />
        </IconButton>

        <Typography
          variant="body2"
          sx={{
            minWidth: 80,
            textAlign: 'center',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          Page {page} of {totalPages}
        </Typography>

        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          size="small"
          sx={{ minWidth: 36 }}
        >
          <FiChevronRight size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
