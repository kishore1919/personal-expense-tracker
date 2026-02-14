/**
 * Dashboard Component - Main dashboard page showing expense overview and books.
 * This is the main landing page of the application after login.
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiBook, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import {
  Box,
  Alert,
  Grid,
} from '@mui/material';
import AddBookModal from './AddBookModal';
import { StatCard, BookCard, BookCardSkeleton, EmptyState, NoResultsState, PageHeader, SearchInput } from './ui';
import { useBooks } from '@/app/hooks/useBooks';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import type { Book } from '@/app/types';

/**
 * Calculates dashboard statistics from books array.
 * Computes total books count, total net worth, and books created this month.
 */
function calculateStats(books: Book[]) {
  const now = new Date();
  
  const booksThisMonth = books.filter((book) => {
    if (!book.createdAtRaw) return false;
    return (
      book.createdAtRaw.getMonth() === now.getMonth() &&
      book.createdAtRaw.getFullYear() === now.getFullYear()
    );
  }).length;

  const totalNetWorth = books.reduce((sum, book) => sum + (book.net ?? 0), 0);

  return {
    totalBooks: books.length,
    totalNetWorth,
    booksThisMonth,
  };
}

/**
 * Main Dashboard component displaying expense overview and book management.
 * Requires authentication to access.
 */
export default function Dashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { loading: authLoading } = useProtectedRoute();
  
  const { books, loading: booksLoading, error, addBook } = useBooks({ calculateNet: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const stats = useMemo(() => calculateStats(books), [books]);

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
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create book');
    }
  }, [addBook]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const loading = authLoading || booksLoading;
  const hasBooks = books.length > 0;
  const hasFilteredBooks = filteredBooks.length > 0;

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here is your expense overview."
        action={{
          label: 'New Book',
          icon: <FiPlus />,
          onClick: () => setIsModalOpen(true),
        }}
      />

      {(error || addError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || addError}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Books"
            value={stats.totalBooks}
            icon={<FiBook size={16} />}
            iconBgColor="primary.main"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Net Worth"
            value={formatCurrency(stats.totalNetWorth)}
            icon={<FiTrendingUp size={16} />}
            iconBgColor="success.main"
            valueColor={stats.totalNetWorth >= 0 ? 'success.main' : 'error.main'}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Books This Month"
            value={stats.booksThisMonth}
            icon={<FiCalendar size={16} />}
            iconBgColor="info.main"
            loading={loading}
          />
        </Grid>
      </Grid>

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
          <PageHeader title="Your Expense Books" />
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
