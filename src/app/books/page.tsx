'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiArchive } from 'react-icons/fi';
import {
  Button,
  Box,
  Alert,
  Container,
  Checkbox,
  Badge,
  useTheme,
} from '@mui/material';
import AddBookModal from '@/app/components/AddBookModal';
import { SearchInput } from '@/app/components/ui';
import { useCurrencyStore } from '@/app/stores';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import { useBooksWithPagination } from '@/app/hooks/useBooksWithPagination';
import { BooksList } from '@/app/components/books/BooksList';
import { BooksPagination } from '@/app/components/books/BooksPagination';
import { DeleteConfirmationDialog } from '@/app/components/books/DeleteConfirmationDialog';
import { QuickAddSuggestions } from '@/app/components/books/QuickAddSuggestions';
import { SelectionToolbar } from '@/app/components/books/SelectionToolbar';
import type { SortOption, PageSize } from '@/app/types';

const SUGGESTIONS = ['February Expenses', 'Home Expense', 'Project Book', 'Account Book'];

export default function BooksPage() {
  const router = useRouter();
  const theme = useTheme(); // Access the theme to check for dark mode
  const { formatCurrency } = useCurrencyStore();
  const { loading: authLoading } = useProtectedRoute();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('last-updated');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  const {
    books,
    displayedBooks,
    loading,
    error,
    totalPages,
    startIndex,
    endIndex,
    addBook,
    deleteBooks,
    isDeleting,
    toggleArchive,
  } = useBooksWithPagination({
    searchQuery,
    sortBy,
    page,
    pageSize,
    showArchived: false,
  });

  const archivedCount = books.filter((b) => b.archived).length;

  const resetListState = useCallback(() => {
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    resetListState();
  }, [resetListState]);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
    resetListState();
  }, [resetListState]);

  const handlePageSizeChange = useCallback((value: PageSize) => {
    setPageSize(value);
    resetListState();
  }, [resetListState]);

  const handleBookClick = useCallback((bookId: string) => {
    router.push(`/book/${bookId}`);
  }, [router]);

  const handleAddBook = useCallback(async (bookName: string) => {
    try {
      setAddError(null);
      await addBook(bookName);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAddError(msg);
    }
  }, [addBook]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const success = await deleteBooks(deleteTarget);
    if (success) {
      setSelectedIds([]);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteBooks]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedBooks.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  }, [displayedBooks]);

  const handleSelectBook = useCallback((bookId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  }, []);

  const areAllSelected = displayedBooks.length > 0 && selectedIds.length === displayedBooks.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < displayedBooks.length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Checkbox
              size="small"
              checked={areAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by book name..."
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
            <BooksPagination.SortSelect value={sortBy} onChange={handleSortChange} />
            
            {/* ARCHIVE BUTTON START */}
            <Button
              variant="outlined"
              onClick={() => router.push('/books/archived')}
              disabled={archivedCount === 0}
              sx={{
                height: 40,
                px: 2,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                // Conditional styling for the whole button if needed
                borderColor: theme.palette.mode === 'dark' ? 'warning.dark' : 'divider',
              }}
            >
              <Badge badgeContent={archivedCount} color="warning" overlap="circular">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiArchive 
                    style={{ 
                      fontSize: '1.2rem',
                      // TARGET: Yellow color only in dark mode
                      color: theme.palette.mode === 'dark' ? '#FFD700' : 'inherit' 
                    }} 
                  />
                  <Box component="span" sx={{ color: 'text.primary' }}>Archived</Box>
                </Box>
              </Badge>
            </Button>
            {/* ARCHIVE BUTTON END */}

            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              startIcon={<FiPlus />}
              sx={{
                height: 40,
                px: { xs: 1, sm: 3 },
                flex: { xs: 1, sm: 'none' },
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Add Book
            </Button>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {addError && <Alert severity="error" sx={{ mb: 3 }}>{addError}</Alert>}

      <BooksPagination.Header
        startIndex={startIndex}
        endIndex={endIndex}
        totalFiltered={displayedBooks.length}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      <BooksList
        books={displayedBooks}
        loading={loading || authLoading}
        selectedIds={selectedIds}
        onSelectBook={handleSelectBook}
        onBookClick={handleBookClick}
        formatCurrency={formatCurrency}
        onToggleArchive={toggleArchive}
      />

      <SelectionToolbar
        selectedCount={selectedIds.length}
        onDelete={() => setDeleteTarget(selectedIds)}
        onCancel={() => setSelectedIds([])}
      />

      <QuickAddSuggestions
        suggestions={SUGGESTIONS}
        onSelect={handleAddBook}
      />

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        count={Array.isArray(deleteTarget) ? deleteTarget.length : 1}
        isDeleting={isDeleting}
      />
    </Container>
  );
}