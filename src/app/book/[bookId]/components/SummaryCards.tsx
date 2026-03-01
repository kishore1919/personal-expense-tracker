'use client';

import { Box, Paper, Typography, Grid } from '@mui/material';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { Theme } from '@mui/material/styles';

interface SummaryCardsProps {
  cashIn: number;
  cashOut: number;
  netBalance: number;
  formatCurrency: (amount: number) => string;
}

export function SummaryCards({ cashIn, cashOut, netBalance, formatCurrency }: SummaryCardsProps) {
  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {[
        {
          label: 'Cash In',
          amount: cashIn,
          color: 'success.main',
          icon: <FiPlus size={24} />,
          getBg: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'success.light'
        },
        {
          label: 'Cash Out',
          amount: cashOut,
          color: 'error.main',
          icon: <FiMinus size={24} />,
          getBg: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'error.light'
        },
        {
          label: 'Net Balance',
          amount: netBalance,
          color: 'primary.main',
          icon: <Typography sx={{ fontWeight: 900, fontSize: 20 }}>=</Typography>,
          getBg: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'primary.light'
        }
      ].map((stat, idx) => (
        <Grid size={{ xs: 12, sm: 4 }} key={idx}>
          <Paper elevation={0} sx={{
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            height: '100%',
            '&:hover': { boxShadow: 1 }
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: stat.getBg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {stat.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" noWrap display="block">
                {stat.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary" noWrap>
                {formatCurrency(stat.amount)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
