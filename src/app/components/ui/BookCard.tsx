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
        height: '100%',
      }}
      onClick={() => onClick(book.id)}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
          <Box
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FaBook size={18} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              noWrap 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.125rem' },
                lineHeight: 1.3,
              }}
            >
              {book.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mt: 0.5,
              }}
            >
              Created {book.createdAt}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontSize: { xs: '1rem', sm: '1.125rem' },
              wordBreak: 'break-word',
            }}
          >
            {netValue}
          </Typography>
          <Typography
            variant="button"
            color="primary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
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
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
          <Skeleton variant="rounded" width={40} height={40} />
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
