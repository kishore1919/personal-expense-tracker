/**
 * ArchivedBooksPage Component - Page for viewing and managing archived books.
 * Provides features to:
 * - View all archived books
 * - Unarchive books to restore them to the main list
 * - Search and sort archived books
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiArchive, FiBook } from 'react-icons/fi';
import {
  Button,
  Box,
  Alert,
  Container,
  Typography,
  Paper,
  Divider,
  Chip,
  Checkbox,
} from '@mui/material';
import { SearchInput } from '@/app/components/ui';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import { useBooksWithPagination } from '@/app/hooks/useBooksWithPagination';
import { BooksList } from '@/app/components/books/BooksList';
import { BooksPagination } from '@/app/components/books/BooksPagination';
import type { SortOption, PageSize } from '@/app/types';

export default function ArchivedBooksPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { loading: authLoading } = useProtectedRoute();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('last-updated');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    displayedBooks,
    loading,
    error,
    totalPages,
    startIndex,
    endIndex,
    toggleArchive,
  } = useBooksWithPagination({
    searchQuery,
    sortBy,
    page,
    pageSize,
    showArchived: true,
  });

  // Filter to show only archived books
  const archivedBooks = displayedBooks.filter((book) => book.archived);
  const totalArchived = archivedBooks.length;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handlePageSizeChange = useCallback((value: PageSize) => {
    setPageSize(value);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleBookClick = useCallback((bookId: string) => {
    router.push(`/book/${bookId}`);
  }, [router]);

  const handleUnarchive = useCallback(async (bookId: string) => {
    await toggleArchive(bookId, false);
    setSelectedIds([]);
  }, [toggleArchive]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(archivedBooks.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  }, [archivedBooks]);

  const handleSelectBook = useCallback((bookId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  }, []);

  const areAllSelected = archivedBooks.length > 0 && selectedIds.length === archivedBooks.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < archivedBooks.length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiArchive size={24} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h4" fontWeight={700}>
                Archived Books
              </Typography>
              <Chip
                label={`${totalArchived} archived`}
                color="warning"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Manage your archived books and restore them when needed
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Controls Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Search and Select All Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Checkbox
              checked={areAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
              sx={{ flexShrink: 0 }}
            />
            <Box sx={{ flex: 1 }}>
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search archived books..."
                fullWidth
              />
            </Box>
          </Box>

          <Divider />

          {/* Action Buttons Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BooksPagination.SortSelect value={sortBy} onChange={handleSortChange} />
            </Box>
            <Button
              variant="outlined"
              onClick={() => router.push('/books')}
              startIcon={<FiBook />}
              sx={{
                height: 42,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Back to Books
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Empty State */}
      {!loading && archivedBooks.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ mb: 2 }}>
            <FiArchive size={48} color="#999" />
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No archived books
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchQuery ? 'No archived books match your search' : 'Books you archive will appear here'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/books')}
            startIcon={<FiBook />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Go to Books
          </Button>
        </Paper>
      )}

      {/* Pagination Header */}
      {archivedBooks.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <BooksPagination.Header
              startIndex={startIndex}
              endIndex={endIndex}
              totalFiltered={totalArchived}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </Box>

          {/* Books List */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <BooksList
              books={archivedBooks}
              loading={loading || authLoading}
              selectedIds={selectedIds}
              onSelectBook={handleSelectBook}
              onBookClick={handleBookClick}
              formatCurrency={formatCurrency}
              onToggleArchive={handleUnarchive}
            />
          </Paper>
        </>
      )}
    </Container>
  );
}
