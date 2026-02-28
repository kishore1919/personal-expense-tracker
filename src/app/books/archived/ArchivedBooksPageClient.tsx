'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiArchive, FiBook, FiArrowLeft, FiEye, FiRefreshCw } from 'react-icons/fi';
import {
  Button,
  Box,
  Alert,
  Container,
  Typography,
  Paper,
  Chip,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  Avatar,
  Alpha,
} from '@mui/material';
import { SearchInput } from '@/app/components/ui';
import { useCurrencyStore } from '@/app/stores';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import { useBooksWithPagination } from '@/app/hooks/useBooksWithPagination';
import { BooksPagination } from '@/app/components/books/BooksPagination';
import type { SortOption, PageSize } from '@/app/types';

export default function ArchivedBooksPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { formatCurrency } = useCurrencyStore();
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

  const archivedBooks = displayedBooks.filter((book) => book.archived);
  const totalArchived = archivedBooks.length;

  const handleUnarchive = useCallback(async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation(); // Prevent navigating to book details
    await toggleArchive(bookId, false);
    setSelectedIds([]);
  }, [toggleArchive]);

  const handleBookClick = (bookId: string) => {
    // Navigate to view data even though it's archived
    router.push(`/book/${bookId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<FiArrowLeft />}
          onClick={() => router.push('/books')}
          sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
        >
          Back to Active Books
        </Button>
        
        {selectedIds.length > 0 && (
            <Button 
                variant="contained" 
                color="warning" 
                startIcon={<FiRefreshCw />}
                sx={{ borderRadius: 2, textTransform: 'none' }}
            >
                Restore Selected ({selectedIds.length})
            </Button>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
          Reference Archive
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review historical data. Books here are <strong>read-only</strong> until restored.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDarkMode ? 'background.paper' : '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <SearchInput
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder="Search archive..."
            sx={{ flex: 1 }}
          />
          <BooksPagination.SortSelect value={sortBy} onChange={(val) => setSortBy(val as SortOption)} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={selectedIds.length === archivedBooks.length && archivedBooks.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? archivedBooks.map(b => b.id) : [])}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Book Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Archive Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Final Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archivedBooks.map((book) => (
                <TableRow 
                  key={book.id} 
                  hover 
                  onClick={() => handleBookClick(book.id)}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox 
                        checked={selectedIds.includes(book.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedIds(prev => checked ? [...prev, book.id] : prev.filter(id => id !== book.id));
                        }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: isDarkMode ? 'grey.800' : 'grey.100', width: 40, height: 40 }}>
                        <FiArchive size={20} color={theme.palette.text.secondary} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>{book.name}</Typography>
                        <Chip label="Read-Only" size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5, bgcolor: 'action.disabledBackground' }} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{book.updatedAtString}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {formatCurrency(book.netBalance ?? 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Data">
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <FiEye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Restore Book">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleUnarchive(e, book.id)}
                          sx={{ color: isDarkMode ? '#FFD700' : 'warning.main' }}
                        >
                          <FiRefreshCw size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
           <BooksPagination.Header
            startIndex={startIndex}
            endIndex={endIndex}
            totalFiltered={totalArchived}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Box>
      </Paper>
    </Container>
  );
}