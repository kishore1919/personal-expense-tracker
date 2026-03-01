'use client';

import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { FiDollarSign, FiCheckCircle, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { useTheme } from '@mui/material/styles';
import { useCurrencyStore } from '@/app/stores';

interface LoanSummaryCardsProps {
  totalPrincipal: number;
  totalPaid: number;
  totalRemainingInterest: number;
  totalLiability: number;
}

export function LoanSummaryCards({
  totalPrincipal,
  totalPaid,
  totalRemainingInterest,
  totalLiability
}: LoanSummaryCardsProps) {
  const { formatCurrency } = useCurrencyStore();
  const theme = useTheme();

  const cards = [
    {
      label: 'Total Principal',
      amount: totalPrincipal,
      color: 'primary.main',
      icon: <FiDollarSign size={16} />,
      bg: theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      border: 'primary.main'
    },
    {
      label: 'Total Paid',
      amount: totalPaid,
      color: 'success.main',
      icon: <FiCheckCircle size={16} />,
      bg: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      border: 'success.main'
    },
    {
      label: 'Rem. Interest',
      amount: totalRemainingInterest,
      color: 'warning.main',
      icon: <FiTrendingUp size={16} />,
      bg: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      border: 'warning.main'
    },
    {
      label: 'Total Due',
      amount: totalLiability,
      color: 'error.main',
      icon: <FiAlertCircle size={16} />,
      bg: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      border: 'error.main',
      showSubtitle: true
    }
  ];

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
      {cards.map((card, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
          <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: card.border }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: card.bg, color: card.color, display: 'flex', flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>
                  {card.label}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color={card.color} sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word', lineHeight: 1.2 }}>
                {formatCurrency(card.amount)}
              </Typography>
              {card.showSubtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  Principal + future interest
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
