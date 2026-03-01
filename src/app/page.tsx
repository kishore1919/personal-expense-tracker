/**
 * Dashboard Component - Main dashboard page showing financial overview and management.
 * Integrated with Loans, Investments, and Budgets for a holistic view.
 */
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  FiPlus, 
  FiTrendingUp, 
  FiCreditCard, 
  FiPieChart, 
  FiTarget, 
  FiArrowRight
} from 'react-icons/fi';
import {
  Box,
  Alert,
  Grid,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';
import AddBookModal from './components/AddBookModal';
import { StatCard, PageHeader } from './components/ui';
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
  
  const { loading: booksLoading, error: booksError, addBook } = useBooks({ calculateNet: true });
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

  const quickActions = [
    { label: 'Add Loan', icon: <FiCreditCard size={16} />, path: '/loans', color: 'error.main' },
    { label: 'Invest', icon: <FiPieChart size={16} />, path: '/investments', color: 'success.main' },
    { label: 'Set Budget', icon: <FiTarget size={16} />, path: '/budget', color: 'info.main' },
  ];

  return (
    <Box className="fade-in" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(' ')[0] || 'User'}!`}
        subtitle="Here is your financial health overview at a glance."
        action={{
          label: 'New Book',
          icon: <FiPlus size={16} />,
          onClick: () => setIsModalOpen(true),
        }}
      />

      {(booksError || overview.error || addError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {booksError || overview.error || addError}
        </Alert>
      )}

      {/* Primary Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }} className="rise-in" style={{ animationDelay: '100ms' }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Net Worth"
            value={formatCurrency(overview.totalNetWorth)}
            icon={<FiTrendingUp size={16} />}
            iconBgColor="primary.main"
            valueColor={overview.totalNetWorth >= 0 ? 'success.main' : 'error.main'}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Debt"
            value={formatCurrency(overview.totalLiability)}
            icon={<FiCreditCard size={16} />}
            iconBgColor="error.main"
            valueColor="error.main"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Investments"
            value={formatCurrency(overview.totalInvestments)}
            icon={<FiPieChart size={16} />}
            iconBgColor="success.main"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Budget Usage"
            value={`${budgetProgress}%`}
            icon={<FiTarget size={16} />}
            iconBgColor="info.main"
            loading={loading}
            footer={
              <>
                <LinearProgress
                  variant="determinate"
                  value={budgetProgress}
                  color={budgetProgress > 90 ? 'error' : budgetProgress > 70 ? 'warning' : 'primary'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {formatCurrency(overview.totalSpent)} of {formatCurrency(overview.totalBudget)}
                </Typography>
              </>
            }
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 6 }} className="rise-in" style={{ animationDelay: '200ms' }}>
        <Typography 
          variant="h5" 
          fontWeight={600} 
          sx={{ 
            mb: 2.5,
            fontSize: { xs: '1.125rem', sm: '1.25rem' } 
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid size={{ xs: 12, sm: 4 }} key={action.label}>
              <Button
                component={Link}
                href={action.path}
                variant="outlined"
                fullWidth
                startIcon={action.icon}
                endIcon={<FiArrowRight size={16} />}
                sx={{ 
                  justifyContent: 'space-between', 
                  py: 1.75, 
                  px: 2.5, 
                  borderRadius: 2.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    borderColor: action.color,
                    bgcolor: 'rgba(99, 102, 241, 0.04)',
                    color: action.color,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Books Section */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </Box>
  );
}
