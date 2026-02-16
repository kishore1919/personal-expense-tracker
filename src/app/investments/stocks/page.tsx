'use client';

import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Container,
} from '@mui/material';
import {
  FiTrendingUp,
  FiArrowLeft,
} from 'react-icons/fi';
import Link from 'next/link';
import { useCurrency } from '../../context/CurrencyContext';

export default function StocksPage() {
  const { getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/investments"
        startIcon={<FiArrowLeft />}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Back to Investments
      </Button>

      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <FiTrendingUp size={40} />
          </Box>

          <Typography variant="h4" fontWeight={600} gutterBottom>
            Stocks
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Track your stock portfolio, monitor gains/losses, and view overall returns. 
            This feature is coming soon!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            You'll be able to:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
            <Typography component="div" variant="body2">• Track stock holdings and quantities</Typography>
            <Typography component="div" variant="body2">• Monitor buy/sell prices</Typography>
            <Typography component="div" variant="body2">• Calculate realized and unrealized gains</Typography>
            <Typography component="div" variant="body2">• View portfolio performance charts</Typography>
            <Typography component="div" variant="body2">• Set price alerts</Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
