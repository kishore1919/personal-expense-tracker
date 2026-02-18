/**
 * Dashboard Component - Main dashboard page showing financial overview and management.
 * Integrated with Loans, Investments, and Budgets for a holistic view.
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import AddBookModal from './AddBookModal';
import { StatCard, BookCard, BookCardSkeleton, EmptyState, NoResultsState, PageHeader, SearchInput } from './ui';
import { useBooks } from '@/app/hooks/useBooks';
import { useFinancialOverview } from '@/app/hooks/useFinancialOverview';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProtectedRoute } from '@/app/hooks/useAuth';

/**
 * Main Dashboard component displaying financial overview and management.
 */
export default function Dashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { user, loading: authLoading } = useProtectedRoute();
  
  const { books, loading: booksLoading, error: booksError, addBook } = useBooks({ calculateNet: true });
  const overview = useFinancialOverview();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter((book) => book.name.toLowerCase().includes(query));
  }, [books, searchQuery]);

  const handleBookClick = useCallback((bookId: string) => {
    router.push(`/book/${bookId}`);
  }, [router]);

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

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const loading = authLoading || booksLoading || overview.loading;
  const hasBooks = books.length > 0;
  const hasFilteredBooks = filteredBooks.length > 0;
  
  const budgetProgress = overview.totalBudget > 0 
    ? Math.min(Math.round((overview.totalSpent / overview.totalBudget) * 100), 100) 
    : 0;

  const quickActions = [
    { label: 'Add Loan', icon: <FiCreditCard />, path: '/loans', color: 'error.main' },
    { label: 'Invest', icon: <FiPieChart />, path: '/investments', color: 'success.main' },
    { label: 'Set Budget', icon: <FiTarget />, path: '/budget', color: 'info.main' },
  ];

  return (
    <Box>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(' ')[0] || 'User'}!`}
        subtitle="Here is your financial health overview at a glance."
        action={{
          label: 'New Book',
          icon: <FiPlus />,
          onClick: () => setIsModalOpen(true),
        }}
      />

      {(booksError || overview.error || addError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {booksError || overview.error || addError}
        </Alert>
      )}

      {/* Primary Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <>
                  <LinearProgress sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: 'info.main', color: 'white', display: 'flex' }}>
                      <FiTarget size={16} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Budget Usage</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={600}>{budgetProgress}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={budgetProgress} 
                    color={budgetProgress > 90 ? 'error' : budgetProgress > 70 ? 'warning' : 'primary'}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatCurrency(overview.totalSpent)} of {formatCurrency(overview.totalBudget)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid size={{ xs: 12, sm: 4 }} key={action.label}>
              <Button
                component={Link}
                href={action.path}
                variant="outlined"
                fullWidth
                startIcon={action.icon}
                endIcon={<FiArrowRight />}
                sx={{ 
                  justifyContent: 'space-between', 
                  py: 2, 
                  px: 3, 
                  borderRadius: 3,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: action.color,
                    bgcolor: 'transparent',
                    color: action.color
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
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 2 
        }}>
          <Typography variant="h5" fontWeight={600}>Your Expense Books</Typography>
          {hasBooks && (
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search books..."
            />
          )}
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <BookCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : hasBooks ? (
          hasFilteredBooks ? (
            <Grid container spacing={2}>
              {filteredBooks.map((book) => (
                <Grid size={{ xs: 12, md: 6 }} key={book.id}>
                  <BookCard
                    book={book}
                    onClick={handleBookClick}
                    formatCurrency={formatCurrency}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoResultsState onClear={clearSearch} />
          )
        ) : (
          <EmptyState onCreate={() => setIsModalOpen(true)} />
        )}
      </Box>

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </Box>
  );
}
