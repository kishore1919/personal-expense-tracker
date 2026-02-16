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
  FiPieChart,
  FiArrowLeft,
} from 'react-icons/fi';
import Link from 'next/link';
import { useCurrency } from '../../context/CurrencyContext';

export default function MutualFundsPage() {
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
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <FiPieChart size={40} />
          </Box>

          <Typography variant="h4" fontWeight={600} gutterBottom>
            Mutual Funds
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Track your mutual fund investments, monitor NAV values, and analyze portfolio performance. 
            This feature is coming soon!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            You'll be able to:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
            <Typography component="div" variant="body2">• Track multiple mutual fund schemes</Typography>
            <Typography component="div" variant="body2">• Monitor NAV and current value</Typography>
            <Typography component="div" variant="body2">• Calculate returns and gains</Typography>
            <Typography component="div" variant="body2">• View portfolio allocation</Typography>
            <Typography component="div" variant="body2">• Set investment goals</Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
