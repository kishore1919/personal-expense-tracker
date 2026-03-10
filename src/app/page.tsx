/**
 * Dashboard Component - Main dashboard page showing financial overview and management.
 * Integrated with Loans, Investments, and Budgets for a holistic view.
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiPlus, 
  FiTrendingUp, 
  FiCreditCard, 
  FiPieChart, 
  FiTarget, 
  FiArrowRight,
  FiActivity,
  FiBriefcase,
  FiChevronRight
} from 'react-icons/fi';
import {
  Box,
  Alert,
  Grid,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddBookModal from './components/AddBookModal';
import { StatCard, BookCard, BookCardSkeleton } from './components/ui';
import { useBooks } from '@/app/hooks/useBooks';
import { useFinancialOverview } from '@/app/hooks/useFinancialOverview';
import { useCurrencyStore } from '@/app/stores';
import { useProtectedRoute } from '@/app/hooks/useAuth';

/**
 * Main Dashboard component displaying financial overview and management.
 */
export default function HomePage() {
  const { formatCurrency } = useCurrencyStore();
  const { user, loading: authLoading } = useProtectedRoute();
  const router = useRouter();
  
  const { books, loading: booksLoading, error: booksError, addBook } = useBooks({ calculateNet: true });
  const overview = useFinancialOverview();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddBook = useCallback(async (bookName: string) => {
    try {
      setAddError(null);
      await addBook(bookName);
      setIsModalOpen(false);
      overview.refetch(); // Refresh overview after adding a book
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create book');
    }
  }, [addBook, overview]);

  const loading = authLoading || booksLoading || overview.loading;
  
  const budgetProgress = overview.totalBudget > 0 
    ? Math.min(Math.round((overview.totalSpent / overview.totalBudget) * 100), 100) 
    : 0;

  const topBooks = useMemo(() => books.slice(0, 4), [books]);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const quickActions = [
    { label: 'Add Loan', icon: <FiCreditCard size={18} />, path: '/loans', color: '#EF4444' },
    { label: 'New Investment', icon: <FiPieChart size={18} />, path: '/investments', color: '#10B981' },
    { label: 'Set Budget', icon: <FiTarget size={18} />, path: '/budget', color: '#3B82F6' },
  ];

  return (
    <Box className="fade-in" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: 'text.primary',
              mb: 0.5
            }}
          >
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {today} • Your financial overview is looking {overview.totalNetWorth >= 0 ? 'good' : 'a bit low'} today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setIsModalOpen(true)}
          sx={{ 
            borderRadius: 2.5, 
            px: 3, 
            py: 1, 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          New Expense Book
        </Button>
      </Box>

      {(booksError || overview.error || addError) && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {booksError || overview.error || addError}
        </Alert>
      )}

      {/* Primary Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Net Worth"
            value={formatCurrency(overview.totalNetWorth)}
            icon={<FiTrendingUp size={20} />}
            iconBgColor="primary.main"
            valueColor={overview.totalNetWorth >= 0 ? 'success.main' : 'error.main'}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Debt"
            value={formatCurrency(overview.totalLiability)}
            icon={<FiCreditCard size={20} />}
            iconBgColor="error.main"
            valueColor="error.main"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Investments"
            value={formatCurrency(overview.totalInvestments)}
            icon={<FiPieChart size={20} />}
            iconBgColor="success.main"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Budget Usage"
            value={`${budgetProgress}%`}
            icon={<FiTarget size={20} />}
            iconBgColor="info.main"
            loading={loading}
            footer={
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={budgetProgress}
                  color={budgetProgress > 90 ? 'error' : budgetProgress > 70 ? 'warning' : 'primary'}
                  sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(overview.totalSpent)} spent
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(overview.totalBudget)} limit
                  </Typography>
                </Box>
              </Box>
            }
          />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiActivity size={20} color="#6366F1" />
        Quick Actions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {quickActions.map((action) => (
          <Grid size={{ xs: 12, sm: 4 }} key={action.label}>
            <Paper
              component={Link}
              href={action.path}
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                textDecoration: 'none',
                color: 'text.primary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(99, 102, 241, 0.02)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px -10px rgba(99, 102, 241, 0.15)',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3, 
                  bgcolor: `${action.color}15`, 
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  {action.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Manage your {action.label.split(' ').pop()?.toLowerCase()}s <FiArrowRight size={14} />
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Financial Insight Banner */}
      <Paper 
        sx={{ 
          p: { xs: 3, sm: 4 }, 
          borderRadius: 4, 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
          }
        }}
      >
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 700, letterSpacing: 1 }}>
            SMART INSIGHT
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Ready for a deep dive into your spending?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Our advanced analytics helps you identify trends and save up to 20% more each month by tracking impulse purchases.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: 'white', 
            color: 'primary.main',
            px: 4,
            py: 1.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 3,
            whiteSpace: 'nowrap'
          }}
          onClick={() => router.push('/analytics')}
        >
          View Detailed Analytics
        </Button>
      </Paper>

      {/* Books Section */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </Box>
  );
}
