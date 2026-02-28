'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiTarget,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useCurrencyStore } from '../stores';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loading from '../components/Loading';

interface Budget {
  id: string;
  bookId: string;
  bookName: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  budgetType: 'book' | 'category';
  category?: string;
  createdAt: Date;
}

interface Book {
  id: string;
  name: string;
}

interface BudgetUpdateData {
  [key: string]: unknown;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  updatedAt: Date;
  budgetType?: 'book' | 'category';
  category?: string;
}

interface BudgetCreateData {
  userId: string;
  bookId: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  budgetType: 'book' | 'category';
  category?: string;
  createdAt: Date;
}

export default function BudgetPage() {
  const [user] = useAuthState(auth);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatCurrency, currency } = useCurrencyStore();

  // Form state
  const [selectedBook, setSelectedBook] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [budgetType, setBudgetType] = useState<'book' | 'category'>('book');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch books
      const booksQuery = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnapshot = await getDocs(booksQuery);
      const booksData = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setBooks(booksData);

      // Fetch categories
      const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', user.uid));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const userCategories = categoriesSnapshot.docs.map(doc => doc.data().name);
      const coreCategories = ['Food', 'Travel', 'Medical', 'Shopping', 'Bills', 'Misc', 'General'];
      setCategories([...coreCategories, ...userCategories]);

      // Fetch budgets
      const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const budgetsSnapshot = await getDocs(budgetsQuery);

      const budgetsData: Budget[] = [];

      // Group budgets by bookId and fetch each book's expenses once to avoid N+1 queries
      const uniqueBookIds = Array.from(new Set(budgetsSnapshot.docs.map(d => d.data().bookId)));
      const bookExpenses = new Map<string, Array<{ amount: number; type?: string; category?: string; createdAt: Date }>>();
      for (const id of uniqueBookIds) {
        try {
          const expensesSnap = await getDocs(collection(db, `books/${id}/expenses`));
          const arr = expensesSnap.docs.map(ed => {
            const data = ed.data();
            return {
              amount: data.amount || 0,
              type: data.type || 'out',
              category: data.category || '',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0),
            };
          });
          bookExpenses.set(id, arr);
        } catch (err) {
          console.error(`Error fetching expenses for book ${id}:`, err);
          bookExpenses.set(id, []);
        }
      }

      const getPeriodRange = (period: 'monthly' | 'weekly' | 'yearly') => {
        const now = new Date();
        if (period === 'weekly') {
          const cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const day = (cur.getDay() + 6) % 7; // Monday as start
          const start = new Date(cur);
          start.setDate(cur.getDate() - day);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        if (period === 'yearly') {
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          return { start, end };
        }
        // monthly (default)
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      };

      for (const budgetDoc of budgetsSnapshot.docs) {
        const budgetData = budgetDoc.data();
        const bookId = budgetData.bookId;
        const budgetType = budgetData.budgetType || 'book';
        const bookName = booksData.find(b => b.id === bookId)?.name || 'Unknown Book';

        const expensesForBook = bookExpenses.get(bookId) || [];
        const { start, end } = getPeriodRange(budgetData.period || 'monthly');

        const spent = expensesForBook.reduce((acc, exp) => {
          if (exp.type !== 'out') return acc;
          if (budgetType === 'category' && budgetData.category) {
            if (exp.category !== budgetData.category) return acc;
          }
          const created = exp.createdAt instanceof Date ? exp.createdAt : new Date(exp.createdAt);
          if (created < start || created > end) return acc;
          return acc + (exp.amount || 0);
        }, 0);

        budgetsData.push({
          id: budgetDoc.id,
          bookId,
          bookName,
          amount: budgetData.amount || 0,
          spent,
          period: budgetData.period || 'monthly',
          budgetType,
          category: budgetData.category,
          createdAt: budgetData.createdAt?.toDate ? budgetData.createdAt.toDate() : new Date(),
        });
      }

      setBudgets(budgetsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercent = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Format number with commas for display (Indian format - lakhs)
  const formatNumberWithCommas = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Split into integer and decimal parts
    const parts = cleanValue.split('.');

    // Indian number format: first comma after 3 digits from right, then every 2 digits
    // e.g., 100000 -> 1,00,000 (1 lakh), 10000000 -> 1,00,00,000 (1 crore)
    const integerPart = parts[0];
    if (integerPart.length > 3) {
      const lastThree = integerPart.substring(integerPart.length - 3);
      const otherNumbers = integerPart.substring(0, integerPart.length - 3);
      const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      parts[0] = formattedOther + ',' + lastThree;
    }

    // Join back
    return parts.join('.');
  };

  // Parse formatted number back to raw number
  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/,/g, ''));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow only numbers, commas, and decimal point
    const formattedValue = formatNumberWithCommas(rawValue);

    // Hard stop at 10 crores (10,00,00,000)
    const numericValue = parseFormattedNumber(formattedValue);
    if (numericValue > 100000000) {
      return; // Don't update state if exceeding 10 crores
    }

    setBudgetAmount(formattedValue);
  };

  // Handle add/edit budget
  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setSelectedBook(budget.bookId);
      setBudgetAmount(formatNumberWithCommas(budget.amount.toString()));
      setBudgetPeriod(budget.period);
      setBudgetType(budget.budgetType || 'book');
      setSelectedCategory(budget.category || '');
    } else {
      setEditingBudget(null);
      setSelectedBook('');
      setBudgetAmount('');
      setBudgetPeriod('monthly');
      setBudgetType('book');
      setSelectedCategory('');
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setSelectedBook('');
    setBudgetAmount('');
    setBudgetPeriod('monthly');
    setBudgetType('book');
    setSelectedCategory('');
    setError(null);
  };

  const handleSaveBudget = async () => {
    if (!user || !selectedBook || !budgetAmount) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate category for category budgets
    if (budgetType === 'category' && !selectedCategory) {
      setError('Please select a category for category budget.');
      return;
    }

    const amount = parseFormattedNumber(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // Maximum limit: 10 crores (100,000,000)
    const MAX_AMOUNT = 100000000;
    if (amount > MAX_AMOUNT) {
      const currencyPrefix = currency ? `${currency} ` : '';
      setError(`Budget amount cannot exceed ${currencyPrefix}10 crores.`);
      return;
    }

    try {
      if (editingBudget) {
        // Update existing budget
        const updateData: BudgetUpdateData = {
          amount,
          period: budgetPeriod,
          updatedAt: new Date(),
        };

        // Only update budgetType and category if they changed (for backward compatibility)
        if (budgetType !== editingBudget.budgetType) {
          updateData.budgetType = budgetType;
        }
        if (budgetType === 'category' && selectedCategory !== editingBudget.category) {
          updateData.category = selectedCategory;
        }

        await updateDoc(doc(db, 'budgets', editingBudget.id), updateData);
      } else {
        // Check for existing budget based on type
        if (budgetType === 'book') {
          // For book budgets, check if any book budget exists for this book
          const existingBookBudget = budgets.find(b =>
            b.bookId === selectedBook && b.budgetType === 'book'
          );
          if (existingBookBudget) {
            setError('A book budget already exists for this book. Please edit the existing budget or create a category budget.');
            return;
          }
        } else {
          // For category budgets, check if this specific category budget exists
          const existingCategoryBudget = budgets.find(b =>
            b.bookId === selectedBook &&
            b.budgetType === 'category' &&
            b.category === selectedCategory
          );
          if (existingCategoryBudget) {
            setError(`A ${selectedCategory} budget already exists for this book. Please edit the existing budget.`);
            return;
          }
        }

        // Create new budget
        const budgetData: BudgetCreateData = {
          userId: user.uid,
          bookId: selectedBook,
          amount,
          period: budgetPeriod,
          budgetType,
          createdAt: new Date(),
        };

        // Add category for category budgets
        if (budgetType === 'category') {
          budgetData.category = selectedCategory;
        }

        await addDoc(collection(db, 'budgets'), budgetData);
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError('Failed to save budget. Please try again.');
    }
  };

  // Handle delete
  const handleDeleteBudget = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'budgets', deleteTarget.id));
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getBudgetStatus = (spent: number, amount: number): { color: 'error' | 'warning' | 'success'; label: string; icon: React.ReactElement } => {
    const percent = amount > 0 ? (spent / amount) * 100 : 0;
    if (percent >= 100) return { color: 'error', label: 'Over Budget', icon: <FiAlertCircle size={16} /> };
    if (percent >= 80) return { color: 'warning', label: 'Warning', icon: <FiAlertCircle size={16} /> };
    return { color: 'success', label: 'On Track', icon: <FiCheckCircle size={16} /> };
  };

  const availableBooks = books.filter(book => !budgets.some(b => b.bookId === book.id && b.budgetType === 'book'));

  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ pb: { xs: 10, sm: 10, md: 4 } }}>
      {/* Header */}
      <Card sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <Box
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiTarget size={16} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.2,
                }}
              >
                Budget
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                Manage your spending limits
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mb: 1 }}
              >
                Total Budget
              </Typography>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {formatCurrency(totalBudget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mb: 1 }}
              >
                Total Spent
              </Typography>
              <Typography
                variant="h5"
                fontWeight={600}
                color="primary.main"
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {formatCurrency(totalSpent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mb: 1 }}
              >
                Remaining
              </Typography>
              <Typography
                variant="h5"
                fontWeight={600}
                color={totalBudget - totalSpent >= 0 ? 'success.main' : 'error.main'}
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {formatCurrency(totalBudget - totalSpent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mb: 1 }}
              >
                Budget Usage
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{
                    fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {overallPercent}%
                </Typography>
                {totalSpent > totalBudget ? (
                  <FiTrendingUp color="red" size={16} />
                ) : (
                  <FiTrendingDown color="green" size={16} />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallPercent}
                color={overallPercent >= 100 ? 'error' : overallPercent >= 80 ? 'warning' : 'primary'}
                sx={{ mt: 0.5, height: { xs: 5, sm: 6 }, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budgets List */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              }}
            >
              Budgets
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenModal()}
              startIcon={<FiPlus />}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: { xs: 3, sm: 4 },
                height: 40,
                width: { sm: 'auto' },
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                  : '0 4px 12px rgba(99, 102, 241, 0.2)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 6px 16px rgba(0, 0, 0, 0.6)'
                    : '0 6px 16px rgba(99, 102, 241, 0.3)',
                  bgcolor: 'primary.dark',
                },
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Add Budget
            </Button>
          </Box>

          {budgets.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 3, sm: 4 },
                textAlign: 'center',
                bgcolor: 'background.default',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                No budgets created yet.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Mobile Card View */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {budgets.map((budget) => {
                  const remaining = budget.amount - budget.spent;
                  const percent = budget.amount > 0 ? Math.min(Math.round((budget.spent / budget.amount) * 100), 100) : 0;
                  const status = getBudgetStatus(budget.spent, budget.amount);

                  return (
                    <Paper
                      key={budget.id}
                      variant="outlined"
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        mb: 2,
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight={600}
                            sx={{
                              fontSize: { xs: '0.9375rem', sm: '1rem' },
                              wordBreak: 'break-word',
                            }}
                          >
                            {budget.bookName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={budget.period}
                              size="small"
                              sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                            />
                            {budget.budgetType === 'category' && budget.category ? (
                              <Chip
                                label={budget.category}
                                size="small"
                                color="primary"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Chip
                                label="All"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(budget)}
                            sx={{ p: 1 }}
                          >
                            <FiEdit2 size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(budget)}
                            color="error"
                            sx={{ p: 1 }}
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Budget Stats Grid */}
                      <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Budget</Typography>
                          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
                            {formatCurrency(budget.amount)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Spent</Typography>
                          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
                            {formatCurrency(budget.spent)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Remaining</Typography>
                          <Typography
                            fontWeight={600}
                            color={remaining >= 0 ? 'success.main' : 'error.main'}
                            sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
                          >
                            {formatCurrency(remaining)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Progress</Typography>
                          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
                            {percent}%
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Progress Bar */}
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        color={status.color as 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'}
                        sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
                      />

                      {/* Status Chip */}
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Paper>
                  );
                })}
              </Box>

              {/* Desktop Table View */}
              <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Book</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Spent</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Remaining</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgets.map((budget) => {
                      const remaining = budget.amount - budget.spent;
                      const percent = budget.amount > 0 ? Math.min(Math.round((budget.spent / budget.amount) * 100), 100) : 0;
                      const status = getBudgetStatus(budget.spent, budget.amount);

                      return (
                        <TableRow key={budget.id} hover>
                          <TableCell>
                            <Typography fontWeight={500}>{budget.bookName}</Typography>
                            <Chip
                              label={budget.period}
                              size="small"
                              sx={{ mt: 0.5, textTransform: 'capitalize', fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            {budget.budgetType === 'category' && budget.category ? (
                              <Chip
                                label={budget.category}
                                size="small"
                                color="primary"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Chip
                                label="All Expenses"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.875rem' }}>{formatCurrency(budget.amount)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.875rem' }}>{formatCurrency(budget.spent)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={remaining >= 0 ? 'success.main' : 'error.main'}
                              fontWeight={500}
                              sx={{ fontSize: '0.875rem' }}
                            >
                              {formatCurrency(remaining)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={percent}
                                color={status.color as 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'}
                                sx={{ width: 100, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="body2" fontWeight={500} sx={{ minWidth: 40, fontSize: '0.875rem' }}>
                                {percent}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              color={status.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenModal(budget)}
                                sx={{ p: 1 }}
                              >
                                <FiEdit2 size={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTarget(budget)}
                                color="error"
                                sx={{ p: 1 }}
                              >
                                <FiTrash2 size={16} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Budget Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 2 },
          },
          display: { sm: 'block' },
        }}
      >
        <DialogTitle sx={{
          p: { xs: 2, sm: 2.5 },
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
        }}>
          {editingBudget ? 'Edit Budget' : 'Add Budget'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 1, sm: 2 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 }, mt: 1 }}>
            {/* Budget Type Selector - only show when adding new budget */}
            {!editingBudget && (
              <FormControl fullWidth>
                <InputLabel>Budget Type</InputLabel>
                <Select
                  value={budgetType}
                  onChange={(e) => {
                    setBudgetType(e.target.value as 'book' | 'category');
                    setSelectedCategory('');
                  }}
                  label="Budget Type"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                    },
                  }}
                >
                  <MenuItem value="book">Book Budget (All Expenses)</MenuItem>
                  <MenuItem value="category">Category Budget (Specific Category)</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Book Selection */}
            {!editingBudget ? (
              <FormControl fullWidth>
                <InputLabel>Select Book</InputLabel>
                <Select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  label="Select Book"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                    },
                  }}
                >
                  {/* For book budgets, only show books without existing book budgets */}
                  {/* For category budgets, show all books */}
                  {(budgetType === 'book' ? availableBooks : books).map((book) => (
                    <MenuItem key={book.id} value={book.id}>
                      {book.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Book</Typography>
                <Typography fontWeight={500} sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' } }}>{editingBudget.bookName}</Typography>
                {editingBudget.budgetType === 'category' && editingBudget.category && (
                  <Chip
                    label={editingBudget.category}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            )}

            {/* Category Selection - only for category budgets */}
            {budgetType === 'category' && !editingBudget && (
              <FormControl fullWidth>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Select Category"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                    },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Budget Amount"
              type="text"
              value={budgetAmount}
              onChange={handleAmountChange}
              fullWidth
              placeholder={`Enter amount in ${currency}`}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Budget Period</InputLabel>
              <Select
                value={budgetPeriod}
                onChange={(e) => setBudgetPeriod(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                label="Budget Period"
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                  },
                }}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: { xs: 2, sm: 2.5 },
          gap: { xs: 1, sm: 1.5 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}>
          <Button
            onClick={handleCloseModal}
            fullWidth
            sx={{
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              fontWeight: 500,
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveBudget}
            variant="contained"
            disabled={!selectedBook || !budgetAmount}
            fullWidth
            sx={{
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              fontWeight: 600,
              px: { xs: 3, sm: 4 },
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            {editingBudget ? 'Update' : 'Create'} Budget
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 2 },
          },
          display: { sm: 'block' },
        }}
      >
        <DialogTitle sx={{
          p: { xs: 2, sm: 2.5 },
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
        }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 1, sm: 2 } }}>
          <Typography sx={{
            fontSize: { xs: '0.9375rem', sm: '1rem' },
            lineHeight: 1.6,
          }}>
            Are you sure you want to delete the budget for &quot;{deleteTarget?.bookName}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: { xs: 2, sm: 2.5 },
          gap: { xs: 1, sm: 1.5 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
            fullWidth
            sx={{
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              fontWeight: 500,
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBudget}
            color="error"
            variant="contained"
            disabled={isDeleting}
            fullWidth
            sx={{
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              fontWeight: 600,
              px: { xs: 3, sm: 4 },
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
