'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiBook, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import AddBookModal from './AddBookModal';
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { useCurrency } from '../context/CurrencyContext';
import { auth, db } from '../firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
  createdAtRaw?: Date | null;
  net?: number;
}

// Skeleton loader for stats
const StatSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="60%" height={40} />
    </CardContent>
  </Card>
);

// Skeleton loader for book cards
const BookSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
      </Box>
      <Skeleton variant="text" width="40%" height={28} />
    </CardContent>
  </Card>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
      border: '2px dashed',
      borderColor: 'divider',
      bgcolor: 'transparent',
    }}
  >
    <CardContent>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <FaBook size={32} />
      </Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        No expense books yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
        Create your first book to organize expenses by goal, trip, or monthly budget.
      </Typography>
      <Button
        variant="contained"
        onClick={onCreate}
        startIcon={<FiPlus />}
        size="large"
      >
        Create Your First Book
      </Button>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      const booksData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const raw = doc.data().createdAt;
        const createdAtDate = raw?.toDate?.() ?? null;

        const expensesSnap = await getDocs(collection(db, `books/${doc.id}/expenses`));
        let cashIn = 0;
        let cashOut = 0;

        expensesSnap.docs.forEach((ed) => {
          const data = ed.data();
          const raw = data.amount;
          const amountNum = Number(raw);
          const safeAmt = Number.isFinite(amountNum) ? amountNum : 0;
          if (data.type === 'in') cashIn += safeAmt;
          else cashOut += safeAmt;
        });

        return {
          id: doc.id,
          name: doc.data().name,
          createdAt: createdAtDate ? createdAtDate.toLocaleDateString() : 'Recently',
          createdAtRaw: createdAtDate,
          net: cashIn - cashOut,
        } as Book;
      }));

      // Sort in memory to avoid index requirement for now
      booksData.sort((a, b) => {
        const dateA = a.createdAtRaw?.getTime() || 0;
        const dateB = b.createdAtRaw?.getTime() || 0;
        return dateB - dateA;
      });

      setBooks(booksData);
      setError(null);
    } catch (e) {
      console.error("Error fetching books:", e);
      setError("Failed to load books. Please try again.");
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
      
      setBooks([{ id: docRef.id, name: bookName, createdAt: 'Just now' }, ...books]);
      setIsModalOpen(false);
      setError(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to create book. Please try again.");
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredBooks = books.filter((book) =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const booksThisMonth = (() => {
    const now = new Date();
    return books.filter((book) =>
      book.createdAtRaw instanceof Date &&
      book.createdAtRaw.getMonth() === now.getMonth() &&
      book.createdAtRaw.getFullYear() === now.getFullYear()
    ).length;
  })();

  const totalNetWorth = books.reduce((sum, book) => sum + (book.net ?? 0), 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here is your expense overview.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setIsModalOpen(true)}
            startIcon={<FiPlus />}
            size="large"
          >
            New Book
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiBook size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Total Books
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={600}>
                  {books.length}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      color: 'success.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingUp size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Net Worth
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  fontWeight={600}
                  sx={{ color: totalNetWorth >= 0 ? 'success.main' : 'error.main' }}
                >
                  {formatCurrency(totalNetWorth)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiCalendar size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Books This Month
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={600}>
                  {booksThisMonth}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Books Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Your Expense Books
          </Typography>
          {books.length > 0 && (
            <TextField
              placeholder="Search books..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
          )}
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <BookSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : books.length > 0 ? (
          filteredBooks.length > 0 ? (
            <Grid container spacing={2}>
              {filteredBooks.map((book) => (
                <Grid size={{ xs: 12, md: 6 }} key={book.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => handleBookClick(book.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FaBook size={20} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap fontWeight={600}>
                            {book.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created {book.createdAt}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            color: (typeof book.net === 'number' && book.net >= 0) ? 'success.main' : 'error.main',
                          }}
                        >
                          {book.net !== undefined ? formatCurrency(book.net) : '—'}
                        </Typography>
                        <Typography
                          variant="button"
                          color="primary"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          View Details →
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  No books match your search.
                </Typography>
                <Button onClick={() => setSearchQuery('')} variant="outlined">
                  Clear search
                </Button>
              </CardContent>
            </Card>
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
