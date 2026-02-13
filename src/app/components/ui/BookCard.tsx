'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { FaBook } from 'react-icons/fa';
import type { Book } from '@/app/types';

interface BookCardProps {
  book: Book;
  onClick: (bookId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function BookCard({ book, onClick, formatCurrency }: BookCardProps) {
  const isPositive = (book.net ?? 0) >= 0;
  const netValue = book.net !== undefined ? formatCurrency(book.net) : '—';

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
      onClick={() => onClick(book.id)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaBook size={20} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap fontWeight={600}>
              {book.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {book.createdAt}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {netValue}
          </Typography>
          <Typography
            variant="button"
            color="primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            View Details
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function BookCardSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="rounded" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={16} />
          </Box>
        </Box>
        <Skeleton variant="text" width="40%" height={28} />
      </CardContent>
    </Card>
  );
}
