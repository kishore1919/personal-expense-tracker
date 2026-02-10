'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiArrowRight,
  FiEdit2,
  FiCopy,
  FiUserPlus,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Alert,
  IconButton,
  Skeleton,
  Paper,
  Container,
  Chip,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
} from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, writeBatch, where } from "firebase/firestore";
import { auth, db } from '../firebase';
import { useRouter } from 'next/navigation';
import AddBookModal from '../components/AddBookModal';
import { useCurrency } from '../context/CurrencyContext';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Book {
  id: string;
  name: string;
  createdAt?: any;
  updatedAtString?: string; // Mapped for UI display
  netBalance?: number; // Calculated net balance from expenses
}

// Skeleton loader for list rows
const ListSkeleton = () => (
  <Paper elevation={0} sx={{ p: 2, mb: 2, border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="text" width="20%" height={16} />
    </Box>
    <Skeleton variant="text" width="10%" height={24} />
    <Skeleton variant="rectangular" width={100} height={30} />
  </Paper>
);

const SUGGESTIONS = ['February Expenses', 'Home Expense', 'Project Book', 'Account Book'];

export default function BooksPage() {
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last-updated' | 'name'>('last-updated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Keep page at 1 and clear selection when the search, sort or pageSize changes for predictable UX
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchQuery, sortBy, pageSize]);

  const router = useRouter();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  const fetchBooks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'books'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      // Fetch books with their net balances
      const booksData = await Promise.all(
        querySnapshot.docs.map(async (bookDoc) => {
          const bookData = bookDoc.data();
          
          // Fetch expenses for this book to calculate net balance
          const expensesSnapshot = await getDocs(collection(db, `books/${bookDoc.id}/expenses`));
          let netBalance = 0;
          
          expensesSnapshot.docs.forEach((expenseDoc) => {
            const expenseData = expenseDoc.data();
            const amount = expenseData.amount || 0;
            if (expenseData.type === 'in') {
              netBalance += amount;
            } else {
              netBalance -= amount;
            }
          });
          
          return {
            id: bookDoc.id,
            name: bookData.name,
            createdAt: bookData.createdAt,
            updatedAtString: 'Updated recently',
            netBalance
          };
        })
      );

      // Sort in memory to avoid index requirement for now
      booksData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });
      
      setBooks(booksData);
      setError(null);
    } catch (error) {
      console.error("Error fetching books:", error);
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookName: string) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: bookName,
        createdAt: new Date(),
        userId: user.uid,
      });
      
      setBooks([{ id: docRef.id, name: bookName, updatedAtString: 'Just now', netBalance: 0 }, ...books]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to create book.");
    }
  };

  const handleDeleteBook = (bookId: string) => {
    // Open confirm dialog instead of using window.confirm()
    setDeleteTarget(bookId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    // Normalize to an array of string ids and filter invalid values
    const idsToDelete = (Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget]).filter(id => typeof id === 'string');
    if (idsToDelete.length === 0) {
      setError('No valid items selected for deletion.');
      setIsDeleting(false);
      setDeleteTarget(null);
      return;
    }

    try {
      for (const bookId of idsToDelete) {
        try {
          // Fetch expense docs for this book and delete them in chunks using document refs
          const expensesSnap = await getDocs(collection(db, 'books', bookId, 'expenses'));
          const expenseRefs = expensesSnap.docs.map(d => d.ref);
          const chunkSize = 499; // keep below 500 per batch

          for (let i = 0; i < expenseRefs.length; i += chunkSize) {
            const batch = writeBatch(db);
            const chunk = expenseRefs.slice(i, i + chunkSize);
            chunk.forEach(ref => batch.delete(ref));
            await batch.commit();
          }

          // Delete the book document itself (in its own operation)
          await deleteDoc(doc(db, 'books', bookId));
        } catch (innerErr) {
          console.error(`Failed deleting book ${bookId}:`, innerErr);
          // rethrow to be caught by outer catch and abort remaining deletions
          throw innerErr;
        }
      }

      setBooks(prev => prev.filter(b => !idsToDelete.includes(b.id)));
      setSelectedIds([]);
      setError(null);
    } catch (e) {
      console.error('Error deleting book(s):', e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete book(s): ${msg}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredAndSortedBooks = React.useMemo(() => {
    let result = books.filter(book =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'last-updated' is already handled by the orderBy query in fetchBooks
    
    return result;
  }, [books, searchQuery, sortBy]);

  // Pagination derived values
  const totalFiltered = filteredAndSortedBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  const displayedBooks = filteredAndSortedBooks.slice((page - 1) * pageSize, page * pageSize);

  // Clamp page after render when totalPages changes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      
      {/* --- Top Controls Section --- */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2, 
        mb: 4, 
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2, 
          alignItems: { xs: 'stretch', sm: 'center' } 
        }}>
          {/* Search & Select */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Checkbox
              size="small"
              checked={selectedIds.length > 0 && selectedIds.length === filteredAndSortedBooks.length}
              indeterminate={selectedIds.length > 0 && selectedIds.length < filteredAndSortedBooks.length}
              onChange={(e) => e.target.checked ? setSelectedIds(filteredAndSortedBooks.map(b => b.id)) : setSelectedIds([])}
            />
            <TextField
              placeholder="Search by book name..."
              size="small"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds([]); }}
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' } 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch color="#888" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            {/* Sort Dropdown */}
            <FormControl size="small" sx={{ minWidth: { xs: '50%', sm: 200 }, flex: { xs: 1, sm: 'none' } }}>
              <Select
                value={sortBy}
                displayEmpty
                sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
                onChange={(e) => setSortBy(e.target.value as 'last-updated' | 'name')}
                renderValue={(selected) => {
                  if (selected === 'last-updated') return 'Last Updated';
                  if (selected === 'name') return 'Name';
                  return selected;
                }}
              >
                <MenuItem value="last-updated">Sort By: Last Updated</MenuItem>
                <MenuItem value="name">Sort By: Name</MenuItem>
              </Select>
            </FormControl>

            {/* Add Button */}
            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              startIcon={<FiPlus />}
              sx={{ 
                height: 40, 
                px: { xs: 1, sm: 3 },
                flex: { xs: 1, sm: 'none' },
                bgcolor: '#4361EE',
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#3651d4' }
              }}
            >
              Add Book
            </Button>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* --- Pagination Header --- */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 2,
        gap: 1
      }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex} - {endIndex} of {totalFiltered}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Select size="small" value={page} onChange={(e) => setPage(Number(e.target.value))} sx={{ height: 32 }}>
              {Array.from({ length: totalPages }).map((_, i) => <MenuItem key={i} value={i + 1}>{i + 1}</MenuItem>)}
            </Select>
            <Typography variant="body2">of {totalPages}</Typography>
            <IconButton size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><FiChevronLeft /></IconButton>
            <IconButton size="small" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><FiChevronRight /></IconButton>
          </Box>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} sx={{ height: 32 }}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* --- Books List --- */}
      <Box sx={{ minHeight: 300 }}>
        {loading ? (
          [1, 2, 3].map((i) => <ListSkeleton key={i} />)
        ) : filteredAndSortedBooks.length > 0 ? (
          displayedBooks.map((book) => (
            <Paper
              key={book.id}
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': (theme) => ({
                  bgcolor: theme.palette.mode === 'dark' ? '#0B1220' : '#f8f9fc',
                  boxShadow: 1
                })
              }}
              onClick={() => handleBookClick(book.id)}
            >
              {/* Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  size="small"
                  checked={selectedIds.includes(book.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newSel = e.target.checked ? [...selectedIds, book.id] : selectedIds.filter(id => id !== book.id);
                    setSelectedIds(newSel);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>
              
              {/* Icon */}
              <Box sx={{ 
                width: { xs: 36, sm: 48 }, 
                height: { xs: 36, sm: 48 }, 
                borderRadius: '50%', 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : '#eef2ff', 
                color: '#4361EE',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FaBook size={18} />
              </Box>

              {/* Title & Date */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary" noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {book.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {book.updatedAtString}
                </Typography>
              </Box>

              {/* Net Balance */}
              <Box sx={{ textAlign: 'right', mr: { xs: 0, sm: 1 } }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color={(book.netBalance ?? 0) >= 0 ? '#00a86b' : '#d32f2f'}
                  sx={{ fontSize: { xs: '0.85rem', sm: '1.1rem' } }}
                >
                  {formatCurrency(Math.abs(book.netBalance ?? 0))}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                <IconButton 
                  onClick={() => handleBookClick(book.id)}
                  size="small" 
                  sx={{ color: '#d32f2f' }}
                >
                  <FiArrowRight size={18} />
                </IconButton>
              </Box>
            </Paper>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No books found</Typography>
            <Typography variant="body2">Try searching for something else</Typography>
          </Box>
        )}
      </Box>

      {/* --- Contextual Delete (Selected Items) --- */}
      {selectedIds.length > 0 && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: { xs: 80, md: 24 }, // Avoid mobile bottom nav
          left: '50%', 
          transform: 'translateX(-50%)', 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : 'white', 
          p: { xs: 1.5, sm: 2 }, 
          borderRadius: 2, 
          boxShadow: 3, 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center', 
          zIndex: 10,
          width: { xs: '90%', sm: 'auto' },
          justifyContent: 'center'
        }}>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{selectedIds.length} selected</Typography>
          <Button variant="contained" color="error" size="small" onClick={() => setDeleteTarget(selectedIds)}>Delete ({selectedIds.length})</Button>
          <Button variant="outlined" size="small" onClick={() => setSelectedIds([])}>Cancel</Button>
        </Box>
      )}

      {/* --- Quick Add / Suggestions Section --- */}
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3 }, 
        mt: 4, 
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#f0f0f0'}` ,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Box sx={{ 
             width: 40, 
             height: 40, 
             borderRadius: '50%', 
             bgcolor: (theme) => theme.palette.mode === 'dark' ? '#072018' : '#e8f5e9', 
             color: (theme) => theme.palette.mode === 'dark' ? '#6EE7B7' : '#2e7d32',
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             flexShrink: 0
           }}>
             <FiPlus size={20} />
           </Box>
           <Box>
             <Typography variant="subtitle2" fontWeight={700}>Quick Add</Typography>
             <Typography variant="caption" color="text.secondary">Select a suggestion to quickly create a book</Typography>
           </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SUGGESTIONS.map((suggestion) => (
            <Chip 
              key={suggestion} 
              label={suggestion} 
              onClick={() => handleAddBook(suggestion)}
              size="small"
              sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0E1B2A' : '#eff2ff', 
                color: (theme) => theme.palette.mode === 'dark' ? '#7FB3FF' : '#4361EE', 
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1522' : '#dde4ff' }
              }} 
            />
          ))}
        </Box>
      </Paper>

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {Array.isArray(deleteTarget) ? `Are you sure you want to delete ${deleteTarget.length} books and all their expenses? This cannot be undone.` : 'Are you sure you want to delete this book and all its expenses? This cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}