'use client';

import { Box, Typography, FormControl, Select, IconButton, MenuItem } from '@mui/material';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationHeaderProps {
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalFiltered: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationHeader({
  page,
  totalPages,
  startIndex,
  endIndex,
  totalFiltered,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationHeaderProps) {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1
    }}>
      <Typography variant="body2" color="text.secondary">
        Showing {startIndex} - {endIndex} of {totalFiltered}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
            <FiChevronLeft />
          </IconButton>
          <Typography variant="body2">{page} / {totalPages}</Typography>
          <IconButton size="small" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
            <FiChevronRight />
          </IconButton>
        </Box>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            sx={{ height: 32 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
