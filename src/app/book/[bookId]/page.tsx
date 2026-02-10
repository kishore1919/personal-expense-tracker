'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiChevronLeft, 
  FiTrash2, 
  FiEdit2,
  FiPlus, 
  FiMinus, 
  FiSearch, 
  FiUserPlus, 
  FiDownload,
  FiChevronDown,
  FiChevronRight
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
  Divider
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, writeBatch, orderBy, query } from "firebase/firestore";
import { db } from '../../../app/firebase'; // Adjust path if needed based on your folder structure
import AddExpenseModal from '../../components/AddExpenseModal'; // Adjust path if needed
import { useCurrency } from '../../context/CurrencyContext'; // Adjust path if needed

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

const MAX_ENTRY_AMOUNT = 99_99_99_999; // 99,99,99,999

// Helper to format date and time separately
const formatDate = (date?: Date) => {
  if (!date) return { date: '-', time: '' };
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function BookDetailPage() {
  const router = useRouter();
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

  // Filter / Search / Sort / Pagination state
  const [durationFilter, setDurationFilter] = useState<'all' | '7' | '30' | '365'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'balance' | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const { formatCurrency } = useCurrency(); // Ensure you have this context or remove and use simple formatter

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId || typeof bookId !== 'string') return;

      try {
        setLoading(true);
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          setBookName(bookSnap.data().name);
        } else {
          setBookName('Expense Book');
        }

        // Fetch expenses ordered by date
        const q = query(collection(db, `books/${bookId}/expenses`), orderBy('createdAt', 'desc'));
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

        setExpenses(expensesData);
      } catch (e) {
        console.error("Error loading data:", e);
        setError('Failed to load book data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

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
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to add expense: ${msg}`);
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
            ? {
                ...entry,
                ...expense,
                createdAt,
              }
            : entry
        )
      );
      handleModalClose();
    } catch (e) {
      console.error("Error updating:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to update expense: ${msg}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !bookId || typeof bookId !== 'string') return;
    setIsDeleting(true);
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];

    // Only delete ids that are still visible in the current filtered set (defensive)
    const idsToDelete = ids.filter(id => filteredExpenses.some(ex => ex.id === id));
    if (idsToDelete.length === 0) {
      setError('No selected items match the current filters.');
      setIsDeleting(false);
      setDeleteTarget(null);
      return;
    }

    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => batch.delete(doc(db, `books/${bookId}/expenses`, id)));
      await batch.commit();

      setExpenses(prev => prev.filter(e => !idsToDelete.includes(e.id)));
      setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      setError(null);
    } catch (e) {
      console.error('Failed to delete items:', e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete selected items: ${msg}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Derived lists: apply filters, search, sorting and compute running balances
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      // Duration filter
      if (durationFilter !== 'all') {
        const days = parseInt(durationFilter, 10);
        const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        if (!e.createdAt || e.createdAt < daysAgo) return false;
      }
      // Type filter
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      // Payment mode filter
      if (paymentModeFilter !== 'all' && e.paymentMode !== paymentModeFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      // Search filter (description / remarks / amount)
      if (searchTerm.trim() !== '') {
        const s = searchTerm.toLowerCase();
        if (!(`${e.description} ${e.remarks} ${e.amount}`.toLowerCase()).includes(s)) return false;
      }
      return true;
    });
  }, [expenses, durationFilter, typeFilter, paymentModeFilter, categoryFilter, searchTerm]);

  // Totals for current filtered view
  const cashIn = useMemo(() => filteredExpenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : 0), 0), [filteredExpenses]);
  const cashOut = useMemo(() => filteredExpenses.reduce((sum, item) => sum + (item.type === 'out' ? item.amount : 0), 0), [filteredExpenses]);
  const netBalance = cashIn - cashOut;
  const bookBalance = useMemo(
    () => expenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : -item.amount), 0),
    [expenses]
  );

  // Sort and compute running balance (balance is cumulative from oldest to newest)
  const sortedWithBalance = useMemo(() => {
    // compute balances (based on chronological history)
    const byDateAsc = [...filteredExpenses].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    let running = 0;
    const balanceMap = new Map<string, number>();
    byDateAsc.forEach(tx => {
      running += tx.type === 'in' ? tx.amount : -tx.amount;
      balanceMap.set(tx.id, running);
    });

    // produce a sorted list based on the requested sort field
    const sorted = [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'amount') return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      if (sortBy === 'balance') {
        const ba = balanceMap.get(a.id) ?? 0;
        const bb = balanceMap.get(b.id) ?? 0;
        return sortDir === 'asc' ? ba - bb : bb - ba;
      }
      // default: sort by date
      return sortDir === 'asc' ? ((a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) : ((b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    });

    return sorted.map(tx => ({ ...tx, balance: balanceMap.get(tx.id) ?? 0 }));
  }, [filteredExpenses, sortBy, sortDir]);

  // Pagination / derived values
  const totalFiltered = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(sortedWithBalance.length / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  const displayedExpenses = sortedWithBalance.slice((page - 1) * pageSize, page * pageSize);

  // Keep page within bounds — update state after render when totalPages changes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Clear selections when filters / search change so we don't hold ids that are no longer visible
  useEffect(() => {
    setSelectedIds([]);
  }, [durationFilter, typeFilter, paymentModeFilter, categoryFilter, searchTerm]);

  // Utilities
  const handleSort = (field: 'createdAt' | 'amount' | 'balance') => {
    if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Time', 'Description', 'Category', 'Mode', 'Amount', 'Balance']
    ];
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
    <Box sx={{ pb: 4 }}>
      
      {/* --- Top Header Navigation --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.back()} size="small">
            <FiChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {bookName} 
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
           <Button variant="outlined" startIcon={<FiDownload />} onClick={exportCSV} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: 'text.primary' }}>
             Reports
           </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {/* --- Filter Bar --- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as 'all' | '7' | '30' | '365')}
            displayEmpty
            sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white', fontSize: '0.875rem' }}
          >
            <MenuItem value={'all'}>Duration: All Time</MenuItem>
            <MenuItem value={'7'}>Last 7 days</MenuItem>
            <MenuItem value={'30'}>Last 30 days</MenuItem>
            <MenuItem value={'365'}>Last 12 months</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'in' | 'out')}
            sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white', fontSize: '0.875rem' }}
          >
            <MenuItem value={'all'}>Types: All</MenuItem>
            <MenuItem value={'in'}>Income</MenuItem>
            <MenuItem value={'out'}>Expense</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={paymentModeFilter} onChange={(e) => setPaymentModeFilter(e.target.value)} sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white', fontSize: '0.875rem' }}>
            <MenuItem value={'all'}>Payment Modes: All</MenuItem>
            {Array.from(new Set(expenses.map(e => e.paymentMode || 'Online'))).map(pm => (
              <MenuItem key={pm} value={pm}>{pm}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white', fontSize: '0.875rem' }}>
            <MenuItem value={'all'}>Categories: All</MenuItem>
            {Array.from(new Set(expenses.map(e => e.category || 'General'))).map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button size="small" onClick={() => { setDurationFilter('all'); setTypeFilter('all'); setPaymentModeFilter('all'); setCategoryFilter('all'); setSearchTerm(''); setPage(1); }}>Clear</Button>
      </Box>

      {/* --- Search & Actions --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Search by remark, description or amount..."
          size="small"
          sx={{ flex: 1, maxWidth: 500, '& .MuiOutlinedInput-root': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><FiSearch color="#999" /></InputAdornment>,
            endAdornment: <Box sx={{ border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#eee'}`, px: 1, borderRadius: 1, fontSize: 12, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#999', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : 'transparent' }}>/</Box>
          }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<FiPlus />}
            onClick={() => { setEditingExpense(null); setModalInitialType('in'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', px: 3, fontWeight: 600, bgcolor: '#00875A' }}
          >
            Cash In
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<FiMinus />}
            onClick={() => { setEditingExpense(null); setModalInitialType('out'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', px: 3, fontWeight: 600, bgcolor: '#DE350B' }}
          >
            Cash Out
          </Button>
        </Box>
      </Box>

      {/* --- Summary Cards --- */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {[
          { label: 'Cash In', amount: cashIn, color: '#00875A', icon: <FiPlus size={28} />, bg: '#E3FCEF' },
          { label: 'Cash Out', amount: cashOut, color: '#DE350B', icon: <FiMinus size={28} />, bg: '#FFEBE6' },
          { label: 'Net Balance', amount: netBalance, color: '#4361EE', icon: <Typography sx={{ fontWeight: 900, fontSize: 24 }}>=</Typography>, bg: '#eff2ff' },
        ].map((stat, idx) => (
          <Box key={idx} sx={{ flex: 1, minWidth: 0 }}>
            <Paper elevation={0} sx={{ 
              width: '100%',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e0e0e0'}` , 
              px: 2,
              py: 2, // Increased vertical padding (length)
              display: 'flex', 
              alignItems: 'center', 
              gap: 3, 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)'
              }
            }}>
              <Box sx={{ 
                width: 64, height: 64, borderRadius: '50%', 
                bgcolor: stat.bg, color: stat.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600} textTransform="uppercase" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
                   {/* Use formatter if available, else simple fallback */}
                   {formatCurrency ? formatCurrency(stat.amount) : stat.amount.toLocaleString()} 
                </Typography>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* --- Table Section --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex} - {endIndex} of {totalFiltered} entries
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
           <Select size="small" value={page} onChange={(e) => setPage(Number(e.target.value))} sx={{ height: 32 }}>
             {Array.from({ length: totalPages }).map((_, i) => <MenuItem key={i} value={i + 1}>Page {i + 1}</MenuItem>)}
           </Select>
           <Typography variant="body2">of {totalPages}</Typography>
           <IconButton size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><FiChevronLeft /></IconButton>
           <IconButton size="small" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><FiChevronRight /></IconButton>
           <FormControl size="small" sx={{ minWidth: 80 }}>
             <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
               <MenuItem value={10}>10</MenuItem>
               <MenuItem value={25}>25</MenuItem>
               <MenuItem value={50}>50</MenuItem>
               <MenuItem value={100}>100</MenuItem>
             </Select>
           </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#f0f0f0'}` }}>
        <Table sx={{ minWidth: 650 }} aria-label="expenses table">
          <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#071427' : '#F4F5F7', '& th': { color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#5E6C84' } }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox 
                  size="small"
                  checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredExpenses.length}
                  onChange={(e) => e.target.checked ? setSelectedIds(filteredExpenses.map(ex => ex.id)) : setSelectedIds([])}
                />
              </TableCell>
              <TableCell 
                onClick={() => handleSort('createdAt')} 
                sx={{ fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#5E6C84', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  Date & Time {sortBy === 'createdAt' ? (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />) : null}
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#5E6C84', fontSize: '0.8rem' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#5E6C84', fontSize: '0.8rem' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#5E6C84', fontSize: '0.8rem' }}>Mode</TableCell>
              <TableCell 
                align="right" 
                onClick={() => handleSort('amount')} 
                sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem', cursor: 'pointer', width: 140, minWidth: 120 }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  Amount {sortBy === 'amount' ? (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />) : null}
                </Box>
              </TableCell>
              <TableCell 
                align="right" 
                onClick={() => handleSort('balance')} 
                sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem', cursor: 'pointer', width: 140, minWidth: 120 }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  Balance {sortBy === 'balance' ? (sortDir === 'asc' ? <FiChevronDown style={{ transform: 'rotate(180deg)' }} /> : <FiChevronDown />) : null}
                </Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem', width: 96 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center">Loading...</TableCell></TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No expenses found.</TableCell></TableRow>
            ) : (
              displayedExpenses.map((row) => {
                const { date, time } = formatDate(row.createdAt);
                const isSelected = selectedIds.indexOf(row.id) !== -1;
                
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': (theme) => ({ backgroundColor: theme.palette.mode === 'dark' ? '#071427' : undefined }) }}
                  >
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
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight={500}>{date}</Typography>
                      <Typography variant="caption" color="text.secondary">{time}</Typography>
                    </TableCell>
                    <TableCell>
                       <Typography variant="body2" color={!row.description || row.description === '--' ? 'text.disabled' : 'text.primary'}>
                         {row.description}
                       </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{row.category}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{row.paymentMode}</Typography></TableCell>
                    <TableCell align="right" sx={{ width: 140, minWidth: 120 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={row.type === 'in' ? 'success.main' : 'error.main'}
                        noWrap
                        sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                      >
                         {formatCurrency ? formatCurrency(row.amount) : row.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 140, minWidth: 120 }}>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                         {formatCurrency ? formatCurrency(row.balance) : row.balance.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={`Edit ${row.description}`}
                        onClick={() => {
                          setEditingExpense(row);
                          setModalInitialType(row.type ?? 'out');
                          setIsModalOpen(true);
                        }}
                      >
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

      {/* Delete Fab/Action (Contextual) */}
      {selectedIds.length > 0 && (
         <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : 'white', p: 2, borderRadius: 2, boxShadow: 3, display: 'flex', gap: 2, alignItems: 'center', zIndex: 10 }}>
           <Typography variant="body2">{selectedIds.length} items selected</Typography>
           <Button variant="contained" color="error" size="small" onClick={() => setDeleteTarget(selectedIds)}>Delete Selected</Button>
           <Button variant="outlined" size="small" onClick={() => setSelectedIds([])}>Cancel</Button>
         </Box>
      )}

      {/* Modals & Dialogs */}
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

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected items? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isDeleting}>
             {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
