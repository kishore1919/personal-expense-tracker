'use client';

import { Box, Typography, IconButton, FormControl, Select, MenuItem } from '@mui/material';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { SortOption, PageSize } from '@/app/types';

interface PaginationHeaderProps {
  startIndex: number;
  endIndex: number;
  totalFiltered: number;
  page: number;
  totalPages: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: '50%', sm: 200 }, flex: { xs: 1, sm: 'none' } }}>
      <Select
        value={value}
        displayEmpty
        sx={{ bgcolor: 'background.default' }}
        onChange={(e) => onChange(e.target.value as SortOption)}
        renderValue={(selected) => {
          if (selected === 'last-updated') return 'Last Updated';
          if (selected === 'name') return 'Name';
          return selected;
        }}
      >
        <MenuItem value="last-updated">Sort By: Last Updated</MenuItem>
        <MenuItem value="name">Sort By: Name</MenuItem>
      </Select>
    </FormControl>
  );
}

function PaginationHeader({
  startIndex,
  endIndex,
  totalFiltered,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationHeaderProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: { xs: 'flex-start', sm: 'center' }, 
      mb: 2,
      gap: 1
    }}>
      <Typography variant="body2" color="text.secondary">
        Showing {startIndex} - {endIndex} of {totalFiltered}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center', 
        width: { xs: '100%', sm: 'auto' }, 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select 
            size="small" 
            value={page} 
            onChange={(e) => onPageChange(Number(e.target.value))} 
            sx={{ height: 32 }}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <MenuItem key={i} value={i + 1}>{i + 1}</MenuItem>
            ))}
          </Select>
          <Typography variant="body2">of {totalPages}</Typography>
          <IconButton 
            size="small" 
            onClick={() => onPageChange(Math.max(1, page - 1))} 
            disabled={page <= 1}
          >
            <FiChevronLeft />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
            disabled={page >= totalPages}
          >
            <FiChevronRight />
          </IconButton>
        </Box>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select 
            value={pageSize} 
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)} 
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

export const BooksPagination = {
  SortSelect,
  Header: PaginationHeader,
};
