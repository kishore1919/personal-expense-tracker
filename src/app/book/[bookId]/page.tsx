'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiChevronLeft, 
  FiTrash2, 
  FiEdit2,
  FiPlus, 
  FiMinus, 
  FiSearch, 
  FiDownload,
  FiChevronDown,
  FiChevronRight,
  FiFilter
} from 'react-icons/fi';
import {
  Button,
  IconButton,
  Typography,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Skeleton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, writeBatch, query } from "firebase/firestore";
import { auth, db } from '../../../app/firebase'; 
import AddExpenseModal from '../../components/AddExpenseModal'; 
import { useCurrency } from '../../context/CurrencyContext'; 
import { useAuthState } from 'react-firebase-hooks/auth';

interface Expense {
  id: string;
  description: string;
  amount: number;
  type?: 'in' | 'out';
  createdAt?: Date;
  remarks?: string;
  category?: string;
  paymentMode?: string;
  attachments?: string[];
  balance?: number;
}

interface ExpensePayload {
  description: string;
  amount: number;
  type: 'in' | 'out';
  createdAt: Date;
  remarks?: string;
  category?: string;
  paymentMode?: string;
  attachments?: string[];
}

const MAX_ENTRY_AMOUNT = 99_99_99_999;

const formatDate = (date?: Date) => {
  if (!date) return { date: '-', time: '' };
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function BookDetailPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { bookId } = useParams();
  
  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'in' | 'out' | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter / Search / Sort / Pagination state
  const [durationFilter, setDurationFilter] = useState<'all' | '7' | '30' | '365'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'balance' | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId || typeof bookId !== 'string' || !user) return;

      try {
        setLoading(true);
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const data = bookSnap.data();
          if (data.userId !== user.uid) {
            router.push('/');
            return;
          }
          setBookName(data.name);
        } else {
          router.push('/');
          return;
        }

        const q = query(collection(db, `books/${bookId}/expenses`));
        const querySnapshot = await getDocs(q);
        
        const expensesData = querySnapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: d.id,
            description: data.description || '--',
            amount: data.amount || 0,
            type: data.type || 'out',
            createdAt,
            remarks: data.remarks || '',
            category: data.category || 'General',
            paymentMode: data.paymentMode || 'Online',
            attachments: data.attachments || [],
          } as Expense;
        });

        expensesData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setExpenses(expensesData);
      } catch (e) {
        console.error("Error loading data:", e);
        setError('Failed to load book data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, user, router]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalInitialType(undefined);
    setEditingExpense(null);
  };

  const handleAddExpense = async (expense: ExpensePayload) => {
    if (!bookId || typeof bookId !== 'string') return;
    try {
      if (!Number.isFinite(expense.amount) || Math.abs(expense.amount) > MAX_ENTRY_AMOUNT) {
        setError(`Amount cannot exceed ${formatCurrency(MAX_ENTRY_AMOUNT)}.`);
        return;
      }
      const createdAt = expense.createdAt instanceof Date ? expense.createdAt : new Date();
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), {
        ...expense,
        createdAt,
      });
      setExpenses((prev) => [{ id: docRef.id, ...expense, createdAt }, ...prev]);
      handleModalClose();
    } catch (e) {
      console.error("Error adding:", e);
      setError(`Failed to add expense.`);
    }
  };

  const handleEditExpense = async (expense: ExpensePayload) => {
    if (!bookId || typeof bookId !== 'string' || !editingExpense) return;
    try {
      if (!Number.isFinite(expense.amount) || Math.abs(expense.amount) > MAX_ENTRY_AMOUNT) {
        setError(`Amount cannot exceed ${formatCurrency(MAX_ENTRY_AMOUNT)}.`);
        return;
      }
      const createdAt = expense.createdAt instanceof Date ? expense.createdAt : new Date();
      await updateDoc(doc(db, `books/${bookId}/expenses`, editingExpense.id), {
        ...expense,
        createdAt,
      });

      setExpenses((prev) =>
        prev.map((entry) =>
          entry.id === editingExpense.id
            ? { ...entry, ...expense, createdAt }
            : entry
        )
      );
      handleModalClose();
    } catch (e) {
      console.error("Error updating:", e);
      setError(`Failed to update expense.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !bookId || typeof bookId !== 'string') return;
    setIsDeleting(true);
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];

    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, `books/${bookId}/expenses`, id)));
      await batch.commit();

      setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
      setError(null);
    } catch (e) {
      console.error('Failed to delete items:', e);
      setError(`Failed to delete selected items.`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      if (durationFilter !== 'all') {
        const days = parseInt(durationFilter, 10);
        const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        if (!e.createdAt || e.createdAt < daysAgo) return false;
      }
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (paymentModeFilter !== 'all' && e.paymentMode !== paymentModeFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (searchTerm.trim() !== '') {
        const s = searchTerm.toLowerCase();
        if (!(`${e.description} ${e.remarks} ${e.amount}`.toLowerCase()).includes(s)) return false;
      }
      return true;
    });
  }, [expenses, durationFilter, typeFilter, paymentModeFilter, categoryFilter, searchTerm]);

  const cashIn = useMemo(() => filteredExpenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : 0), 0), [filteredExpenses]);
  const cashOut = useMemo(() => filteredExpenses.reduce((sum, item) => sum + (item.type === 'out' ? item.amount : 0), 0), [filteredExpenses]);
  const netBalance = cashIn - cashOut;
  const bookBalance = useMemo(
    () => expenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : -item.amount), 0),
    [expenses]
  );

  const sortedWithBalance = useMemo(() => {
    const byDateAsc = [...filteredExpenses].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    let running = 0;
    const balanceMap = new Map<string, number>();
    byDateAsc.forEach(tx => {
      running += tx.type === 'in' ? tx.amount : -tx.amount;
      balanceMap.set(tx.id, running);
    });

    const sorted = [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'amount') return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      if (sortBy === 'balance') {
        const ba = balanceMap.get(a.id) ?? 0;
        const bb = balanceMap.get(b.id) ?? 0;
        return sortDir === 'asc' ? ba - bb : bb - ba;
      }
      return sortDir === 'asc' ? ((a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) : ((b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    });

    return sorted.map(tx => ({ ...tx, balance: balanceMap.get(tx.id) ?? 0 }));
  }, [filteredExpenses, sortBy, sortDir]);

  const totalFiltered = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(sortedWithBalance.length / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  const displayedExpenses = sortedWithBalance.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedIds([]);
  }, [durationFilter, typeFilter, paymentModeFilter, categoryFilter, searchTerm]);

  const handleSort = (field: 'createdAt' | 'amount' | 'balance') => {
    if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const rows = [['Date', 'Time', 'Description', 'Category', 'Mode', 'Amount', 'Balance']];
    sortedWithBalance.forEach(r => {
      const d = r.createdAt ? r.createdAt.toLocaleDateString('en-GB') : '';
      const t = r.createdAt ? r.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      rows.push([d, t, r.description, r.category || '', r.paymentMode || '', String(r.amount), String(r.balance ?? '')]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookName || 'report'}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ pb: { xs: 10, md: 4 }, px: { xs: 1, sm: 2 } }}>
      
      {/* --- Top Header Navigation --- */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.back()} size="small" sx={{ ml: -1 }}>
            <FiChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={700} noWrap sx={{ maxWidth: { xs: '200px', sm: '100%' } }}>
            {bookName || <Skeleton width={120} />} 
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
           <Button 
             variant="outlined" 
             startIcon={<FiDownload />} 
             onClick={exportCSV} 
             fullWidth={isMobile}
             sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
           >
             Export
           </Button>
           <Button 
             variant="outlined" 
             startIcon={<FiFilter />} 
             onClick={() => setShowFilters(!showFilters)} 
             color={showFilters ? 'primary' : 'inherit'}
             sx={{ display: { md: 'none' }, minWidth: 'auto' }}
           >
             Filters
           </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {/* --- Filter Bar --- */}
      <Collapse in={showFilters || !isMobile}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          mb: 3, 
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <Select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as any)}
              displayEmpty
              sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
            >
              <MenuItem value={'all'}>Duration: All Time</MenuItem>
              <MenuItem value={'7'}>Last 7 days</MenuItem>
              <MenuItem value={'30'}>Last 30 days</MenuItem>
              <MenuItem value={'365'}>Last 12 months</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
            >
              <MenuItem value={'all'}>Types: All</MenuItem>
              <MenuItem value={'in'}>Income</MenuItem>
              <MenuItem value={'out'}>Expense</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <Select 
              value={paymentModeFilter} 
              onChange={(e) => setPaymentModeFilter(e.target.value)} 
              sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
            >
              <MenuItem value={'all'}>Payment Modes: All</MenuItem>
              {Array.from(new Set(expenses.map(e => e.paymentMode || 'Online'))).map(pm => (
                <MenuItem key={pm} value={pm}>{pm}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
            >
              <MenuItem value={'all'}>Categories: All</MenuItem>
              {Array.from(new Set(expenses.map(e => e.category || 'General'))).map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            fullWidth={isMobile}
            onClick={() => { setDurationFilter('all'); setTypeFilter('all'); setPaymentModeFilter('all'); setCategoryFilter('all'); setSearchTerm(''); setPage(1); }}
          >
            Clear Filters
          </Button>
        </Box>
      </Collapse>

      {/* --- Search & Actions --- */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4, 
        gap: 2, 
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        <TextField
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Search remark, desc or amount..."
          size="small"
          fullWidth
          sx={{ maxWidth: { md: 500 }, '& .MuiOutlinedInput-root': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><FiSearch color="#999" /></InputAdornment>
          }}
        />
        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<FiPlus />}
            fullWidth
            onClick={() => { setEditingExpense(null); setModalInitialType('in'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#00875A' }}
          >
            Cash In
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<FiMinus />}
            fullWidth
            onClick={() => { setEditingExpense(null); setModalInitialType('out'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DE350B' }}
          >
            Cash Out
          </Button>
        </Box>
      </Box>

      {/* --- Summary Cards --- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Cash In', amount: cashIn, color: '#00875A', icon: <FiPlus size={24} />, bg: '#E3FCEF' },
          { label: 'Cash Out', amount: cashOut, color: '#DE350B', icon: <FiMinus size={24} />, bg: '#FFEBE6' },
          { label: 'Net Balance', amount: netBalance, color: '#4361EE', icon: <Typography sx={{ fontWeight: 900, fontSize: 20 }}>=</Typography>, bg: '#eff2ff' },
        ].map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 4 }} key={idx}>
            <Paper elevation={0} sx={{ 
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e0e0e0'}` , 
              p: 2,
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              height: '100%',
              '&:hover': { boxShadow: 1 }
            }}>
              <Box sx={{ 
                width: 48, height: 48, borderRadius: '50%', 
                bgcolor: stat.bg, color: stat.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {stat.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" noWrap display="block">
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} color="text.primary" noWrap>
                   {formatCurrency(stat.amount)} 
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* --- Pagination Header --- */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1
      }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex} - {endIndex} of {totalFiltered}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
           <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
             <IconButton size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><FiChevronLeft /></IconButton>
             <Typography variant="body2">{page} / {totalPages}</Typography>
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

      {/* --- Table / Card Section --- */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={100} />)
          ) : displayedExpenses.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No entries found</Typography></Paper>
          ) : (
            displayedExpenses.map((row) => {
              const { date, time } = formatDate(row.createdAt);
              const isSelected = selectedIds.includes(row.id);
              return (
                <Paper key={row.id} sx={{ 
                  p: 2, 
                  border: theme => `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: theme => isSelected ? (theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#f5f6ff') : 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox 
                        size="small" 
                        checked={isSelected}
                        sx={{ p: 0 }}
                        onChange={(e) => {
                          const newSelected = e.target.checked 
                            ? [...selectedIds, row.id] 
                            : selectedIds.filter(id => id !== row.id);
                          setSelectedIds(newSelected);
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{row.description}</Typography>
                        <Typography variant="caption" color="text.secondary">{date} • {time}</Typography>
                      </Box>
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={700}
                      color={row.type === 'in' ? 'success.main' : 'error.main'}
                    >
                      {row.type === 'in' ? '+' : '-'}{formatCurrency(row.amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.2, borderRadius: 1 }}>{row.category}</Typography>
                      <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.2, borderRadius: 1 }}>{row.paymentMode}</Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => {
                        setEditingExpense(row);
                        setModalInitialType(row.type ?? 'out');
                        setIsModalOpen(true);
                      }}
                    >
                      <FiEdit2 size={16} />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#071427' : '#F4F5F7' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    size="small"
                    checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredExpenses.length}
                    onChange={(e) => e.target.checked ? setSelectedIds(filteredExpenses.map(ex => ex.id)) : setSelectedIds([])}
                  />
                </TableCell>
                <TableCell onClick={() => handleSort('createdAt')} sx={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: 600 }}>
                    Date & Time {sortBy === 'createdAt' && (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />)}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                <TableCell align="right" onClick={() => handleSort('amount')} sx={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600 }}>
                    Amount {sortBy === 'amount' && (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />)}
                  </Box>
                </TableCell>
                <TableCell align="right" onClick={() => handleSort('balance')} sx={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600 }}>
                    Balance {sortBy === 'balance' && (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />)}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} align="center">
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredExpenses.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No expenses found.</TableCell></TableRow>
              ) : (
                displayedExpenses.map((row) => {
                  const { date, time } = formatDate(row.createdAt);
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <TableRow key={row.id} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelected = e.target.checked 
                              ? [...selectedIds, row.id] 
                              : selectedIds.filter(id => id !== row.id);
                            setSelectedIds(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{date}</Typography>
                        <Typography variant="caption" color="text.secondary">{time}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{row.description}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{row.category}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{row.paymentMode}</Typography></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color={row.type === 'in' ? 'success.main' : 'error.main'}>
                           {formatCurrency(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>{formatCurrency(row.balance ?? 0)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => { setEditingExpense(row); setModalInitialType(row.type ?? 'out'); setIsModalOpen(true); }}>
                          <FiEdit2 />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Selection Bar */}
      {selectedIds.length > 0 && (
         <Box sx={{ 
           position: 'fixed', 
           bottom: { xs: 80, md: 24 }, 
           left: '50%', 
           transform: 'translateX(-50%)', 
           bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : 'white', 
           p: 2, 
           borderRadius: 2, 
           boxShadow: 3, 
           display: 'flex', 
           gap: 2, 
           alignItems: 'center', 
           zIndex: 10,
           width: { xs: '90%', sm: 'auto' },
           justifyContent: 'center'
         }}>
           <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{selectedIds.length} items selected</Typography>
           <Button variant="contained" color="error" size="small" onClick={() => setDeleteTarget(selectedIds)}>Delete ({selectedIds.length})</Button>
           <Button variant="outlined" size="small" onClick={() => setSelectedIds([])}>Cancel</Button>
         </Box>
      )}

      <AddExpenseModal
        isOpen={isModalOpen}
        initialType={modalInitialType}
        currentBalance={bookBalance}
        initialExpense={editingExpense ? {
          description: editingExpense.description,
          amount: editingExpense.amount,
          type: editingExpense.type,
          createdAt: editingExpense.createdAt,
          remarks: editingExpense.remarks,
          category: editingExpense.category,
          paymentMode: editingExpense.paymentMode,
        } : undefined}
        onClose={handleModalClose}
        onAddExpense={editingExpense ? handleEditExpense : handleAddExpense}
      />

      <Dialog open={deleteTarget !== null} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete the selected items? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isDeleting}>
             {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}