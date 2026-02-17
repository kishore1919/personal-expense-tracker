'use client';

import React from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
} from '@mui/material';
import {
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiArrowRight,
} from 'react-icons/fi';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

interface InvestmentOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgColor: string;
}

export default function InvestmentsOverviewPage() {
  const { getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();

  const investmentOptions: InvestmentOption[] = [
    {
      title: 'Fixed Deposits',
      description: 'Track your FDs, calculate maturity amounts, and monitor returns from bank deposits.',
      icon: <FiDollarSign size={32} />,
      path: '/investments/fd',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Mutual Funds',
      description: 'Track your mutual fund investments, NAV values, and portfolio performance.',
      icon: <FiPieChart size={32} />,
      path: '/investments/mutual-funds',
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      title: 'Stocks',
      description: 'Track your stock portfolio, monitor gains/losses, and view overall returns.',
      icon: <FiTrendingUp size={32} />,
      path: '/investments/stocks',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            {currencySymbol}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Investments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all your investments in one place
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Investment Options Grid */}
      <Grid container spacing={3}>
        {investmentOptions.map((option) => (
          <Grid size={{ xs: 12, md: 4 }} key={option.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              component={Link}
              href={option.path}
            >
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    bgcolor: option.bgColor,
                    color: option.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  {option.icon}
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {option.title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {option.description}
                </Typography>

                <Button
                  variant="outlined"
                  endIcon={<FiArrowRight />}
                  sx={{
                    mt: 'auto',
                    textTransform: 'none',
                    borderColor: option.color,
                    color: option.color,
                    '&:hover': {
                      borderColor: option.color,
                      bgcolor: option.bgColor,
                    },
                  }}
                >
                  View {option.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats Section */}
      <Card sx={{ mt: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Investment Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select an investment type above to view detailed information, track your portfolio, 
            and monitor returns. You can manage Fixed Deposits, Mutual Funds, and Stocks separately 
            to get a complete picture of your investment portfolio.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
