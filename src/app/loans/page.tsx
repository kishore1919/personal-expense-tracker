'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiEdit2,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
} from 'react-icons/fi';
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
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  DialogContentText,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import { useCurrency } from '../context/CurrencyContext';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Loan interface representing a loan entity in the system
 */
interface Loan {
  id: string;                    // Unique Firestore document ID
  name: string;                  // Loan name/purpose
  lender: string;                // Name of the lender/institution
  amount: number;                // Original principal amount
  paidAmount: number;            // Amount already paid
  interestRate: number;          // Annual interest rate as percentage
  monthlyPayment: number;        // Monthly EMI payment
  isActive: boolean;             // Whether loan is currently active
  createdAt?: { toDate?: () => Date } | Date | undefined;  // Creation timestamp
}

/**
 * Skeleton loader component for table rows during data loading
 * Displays placeholder shapes that mimic the actual table row structure
 */
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={80} height={30} /></TableCell>
  </TableRow>
);

export default function LoansPage() {
  // Authentication state from Firebase
  const [user] = useAuthState(auth);

  // Loan data state
  const [loans, setLoans] = useState<Loan[]>([]);

  // Modal and editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'monthsLeft' | 'totalRemaining' | 'remaining' | 'name' | 'interestRate'>('monthsLeft');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Form state for add/edit modal
  const [formData, setFormData] = useState({
    name: '',
    lender: '',
    amount: '',
    paidAmount: '',
    interestRate: '',
    monthlyPayment: '',
  });

  // Currency formatting from context
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();

  // Reset to page 1 when search, sort, or page size changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, pageSize]);

  // Fetch loans from Firestore when user is authenticated
  useEffect(() => {
    if (!user) return;

    const fetchLoans = async () => {
      try {
        setLoading(true);
        // Query loans collection filtered by current user's ID
        const q = query(collection(db, 'loans'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        // Transform Firestore documents to Loan objects
        const loansData = querySnapshot.docs.map((loanDoc) => {
          const data = loanDoc.data();
          return {
            id: loanDoc.id,
            name: data.name || 'Unnamed Loan',
            lender: data.lender || 'Unknown',
            amount: Number(data.amount) || 0,
            paidAmount: Number(data.paidAmount) || 0,
            interestRate: Number(data.interestRate) || 0,
            monthlyPayment: Number(data.monthlyPayment) || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: data.createdAt,
          };
        });

        setLoans(loansData);
        setError(null);
      } catch (e) {
        console.error("Error loading loans:", e);
        setError('Failed to load loans.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [user]);

  /**
   * Calculate loan details including remaining balance, interest, and payoff timeline
   * Uses standard loan amortization formula for accurate calculations
   */
  const calculateLoanDetails = (loan: Loan) => {
    const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
    const monthlyRate = loan.interestRate ? loan.interestRate / 100 / 12 : 0;
    const monthly = loan.monthlyPayment || 0;

    let monthsLeft: number | '∞' = 0;
    let remainingInterest = 0;
    let totalRemainingPayments = remaining;

    const isPaidOff = remaining <= 0;

    if (!isPaidOff && monthly > 0) {
      if (monthlyRate === 0) {
        // Simple loan with no interest
        monthsLeft = Math.ceil(remaining / monthly);
        remainingInterest = 0;
        totalRemainingPayments = remaining;
      } else {
        // Standard amortization formula: P * r / (1 - (1 + r)^-n)
        // Solving for n (number of payments)
        const denominator = monthly - remaining * monthlyRate;
        if (denominator > 0) {
          const exact = Math.log(monthly / denominator) / Math.log(1 + monthlyRate);
          monthsLeft = Math.ceil(exact);
          totalRemainingPayments = monthsLeft * monthly;
          remainingInterest = totalRemainingPayments - remaining;
        } else {
          // EMI is too low to cover interest - loan will never be paid off
          monthsLeft = '∞';
          remainingInterest = Infinity;
          totalRemainingPayments = Infinity;
        }
      }
    } else if (!isPaidOff) {
      // No monthly payment specified - calculate simple interest
      remainingInterest = remaining * (loan.interestRate / 100);
      totalRemainingPayments = remaining + remainingInterest;
    }

    return { remaining, remainingInterest, totalRemainingPayments, monthsLeft, isPaidOff };
  };

  /**
   * Save loan to Firestore (create new or update existing)
   */
  const handleSaveLoan = async () => {
    if (!user) return;
    if (!formData.name || !formData.lender || !formData.amount) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const loanData = {
        name: formData.name,
        lender: formData.lender,
        amount: Number(formData.amount),
        paidAmount: Number(formData.paidAmount) || 0,
        interestRate: Number(formData.interestRate) || 0,
        monthlyPayment: Number(formData.monthlyPayment) || 0,
        isActive: true,
        createdAt: new Date(),
        userId: user.uid,
      };

      if (editingLoan) {
        // Update existing loan
        const loanRef = doc(db, 'loans', editingLoan.id);
        await updateDoc(loanRef, loanData);
        setLoans(prev => prev.map(l => l.id === editingLoan.id ? { ...l, ...loanData } : l));
      } else {
        // Create new loan
        const docRef = await addDoc(collection(db, 'loans'), loanData);
        setLoans(prev => [{ ...loanData, id: docRef.id }, ...prev]);
      }

      // Close modal and reset form
      setIsModalOpen(false);
      setEditingLoan(null);
      setFormData({ name: '', lender: '', amount: '', paidAmount: '', interestRate: '', monthlyPayment: '' });
      setError(null);
    } catch (e) {
      console.error("Error saving loan: ", e);
      setError("Failed to save loan.");
    }
  };

  /**
   * Delete a loan from Firestore
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'loans', deleteTarget));
      setLoans(prev => prev.filter(l => l.id !== deleteTarget));
      setError(null);
    } catch (e) {
      console.error('Error deleting loan:', e);
      setError('Failed to delete loan.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /**
   * Open modal for adding a new loan
   * Resets form data to empty values
   */
  const openAddModal = () => {
    setEditingLoan(null);
    setFormData({ name: '', lender: '', amount: '', paidAmount: '', interestRate: '', monthlyPayment: '' });
    setIsModalOpen(true);
  };

  /**
   * Open modal for editing an existing loan
   * Pre-fills form with current loan data
   */
  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      name: loan.name,
      lender: loan.lender,
      amount: loan.amount.toString(),
      paidAmount: loan.paidAmount.toString(),
      interestRate: loan.interestRate.toString(),
      monthlyPayment: loan.monthlyPayment.toString(),
    });
    setIsModalOpen(true);
  };

  /**
   * Filter and sort loans based on search query and sort criteria
   * Memoized to prevent unnecessary recalculations
   */
  const filteredAndSortedLoans = useMemo(() => {
    // Filter by name or lender
    let result = loans.filter(loan =>
      loan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.lender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort according to selected criteria
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'remaining') {
        // Sort by remaining principal using calculated values for accuracy
        const aRemaining = a.amount - (a.paidAmount || 0);
        const bRemaining = b.amount - (b.paidAmount || 0);
        return bRemaining - aRemaining;
      }

      const aCalc = calculateLoanDetails(a);
      const bCalc = calculateLoanDetails(b);

      if (sortBy === 'monthsLeft') {
        const aVal = Number.isFinite(aCalc.monthsLeft) ? (aCalc.monthsLeft as number) : Infinity;
        const bVal = Number.isFinite(bCalc.monthsLeft) ? (bCalc.monthsLeft as number) : Infinity;
        return bVal - aVal;
      }
      if (sortBy === 'totalRemaining') {
        const aVal = Number.isFinite(aCalc.totalRemainingPayments) ? aCalc.totalRemainingPayments : Infinity;
        const bVal = Number.isFinite(bCalc.totalRemainingPayments) ? bCalc.totalRemainingPayments : Infinity;
        return bVal - aVal;
      }
      if (sortBy === 'interestRate') return b.interestRate - a.interestRate;

      return 0;
    });

    return result;
  }, [loans, searchQuery, sortBy]);

  // Calculate aggregate statistics for summary cards
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);

  const totalRemainingInterest = loans.reduce((sum, loan) => {
    const { remainingInterest } = calculateLoanDetails(loan);
    return sum + (Number.isFinite(remainingInterest) ? remainingInterest : 0);
  }, 0);

  const totalLiability = loans.reduce((sum, loan) => {
    const { totalRemainingPayments } = calculateLoanDetails(loan);
    return sum + (Number.isFinite(totalRemainingPayments) ? totalRemainingPayments : loan.amount - (loan.paidAmount || 0));
  }, 0);

  // Pagination calculations
  const totalFiltered = filteredAndSortedLoans.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const displayedLoans = filteredAndSortedLoans.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Summary statistics cards - only show when not loading */}
      {!loading && (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'primary.main' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)', color: 'primary.main', display: 'flex', flexShrink: 0 }}>
                    <FiDollarSign size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>Total Principal</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word', lineHeight: 1.2 }}>{formatCurrency(totalPrincipal)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'success.main' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: 'success.main', display: 'flex', flexShrink: 0 }}>
                    <FiCheckCircle size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>Total Paid</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word', lineHeight: 1.2 }}>{formatCurrency(totalPaid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'warning.main' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: 'warning.main', display: 'flex', flexShrink: 0 }}>
                    <FiTrendingUp size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>Rem. Interest</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word', lineHeight: 1.2 }}>{formatCurrency(totalRemainingInterest)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: 'error.main', display: 'flex', flexShrink: 0 }}>
                    <FiAlertCircle size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>Total Due</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word', lineHeight: 1.2 }}>{formatCurrency(totalLiability)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>Principal + future interest</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and filter controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 }, mb: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <TextField
              placeholder="Search by loan name or lender..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><FiSearch size={18} /></InputAdornment>,
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: 1, sm: 'none' } }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                  },
                }}
              >
                <MenuItem value="monthsLeft">Sort By: Est. Months Left</MenuItem>
                <MenuItem value="totalRemaining">Sort By: Est. Total Remaining</MenuItem>
                <MenuItem value="remaining">Sort By: Remaining Principal</MenuItem>
                <MenuItem value="name">Sort By: Name</MenuItem>
                <MenuItem value="interestRate">Sort By: Interest Rate</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={openAddModal}
              startIcon={<FiPlus />}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 2, sm: 3 },
                display: { sm: 'inline-block' },
                width: { sm: 'auto' },
              }}
            >
              Add Loan
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error display */}
      {error && <Alert severity="error" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>{error}</Alert>}

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          // Skeleton loaders for mobile cards
          [1, 2, 3].map((i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" height={8} sx={{ mt: 2, mb: 1 }} />
              <Skeleton variant="text" width="30%" height={20} />
            </Paper>
          ))
        ) : displayedLoans.length > 0 ? (
          // Loan cards for mobile
          displayedLoans.map((loan) => {
            const { remaining, remainingInterest, totalRemainingPayments, monthsLeft, isPaidOff } = calculateLoanDetails(loan);
            const progress = loan.amount > 0 ? ((loan.paidAmount || 0) / loan.amount) * 100 : 0;

            return (
              <Paper
                key={loan.id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                {/* Header with name and actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '0.9375rem', sm: '1rem' },
                        wordBreak: 'break-word',
                      }}
                    >
                      {loan.name}
                    </Typography>
                    <Typography 
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        mt: 0.5,
                      }}
                    >
                      {loan.lender}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => openEditModal(loan)}
                      sx={{ p: 1 }}
                    >
                      <FiEdit2 size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(loan.id)}
                      color="error"
                      sx={{ p: 1 }}
                    >
                      <FiTrash2 size={16} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Progress bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Progress</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>{progress.toFixed(0)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    color={isPaidOff ? "success" : "primary"} 
                    sx={{ height: 6, borderRadius: 3 }} 
                  />
                </Box>

                {/* Loan Stats Grid */}
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Principal</Typography>
                    <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                      {formatCurrency(loan.amount)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Paid</Typography>
                    <Typography fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                      {formatCurrency(loan.paidAmount || 0)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Balance</Typography>
                    <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                      {formatCurrency(remaining)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>EMI</Typography>
                    <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                      {formatCurrency(loan.monthlyPayment || 0)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Additional Info */}
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Months Left</Typography>
                    <Typography 
                      fontWeight={600} 
                      color={monthsLeft === '∞' ? 'error.main' : 'text.primary'}
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {monthsLeft === '∞' ? 'Insufficient' : monthsLeft === 0 ? 'Paid' : `${monthsLeft} mo`}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Interest</Typography>
                    <Typography 
                      fontWeight={600} 
                      color="warning.main"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {Number.isFinite(remainingInterest) ? formatCurrency(remainingInterest) : 'Accruing'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Total Due */}
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)', 
                  borderRadius: 1.5,
                  mb: 1.5,
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Total Due</Typography>
                  <Typography 
                    fontWeight={700} 
                    color="error.main"
                    sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' } }}
                  >
                    {Number.isFinite(totalRemainingPayments) ? formatCurrency(totalRemainingPayments) : 'Infinite'}
                  </Typography>
                </Box>

                {/* Status Chip */}
                <Chip 
                  label={isPaidOff ? "Paid Off" : (loan.isActive ? "Active" : "Closed")} 
                  color={isPaidOff ? "success" : loan.isActive ? "primary" : "default"}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Paper>
            );
          })
        ) : (
          // Empty state for mobile
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              No loans found
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Desktop Table View */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { px: 1.5, py: 1.5 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Loan Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Lender</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">Principal</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">Paid</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">Balance</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">EMI</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">Months</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="right">Interest</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8125rem', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>Total Due</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Show skeleton loaders while fetching data
              [1, 2, 3].map((i) => <TableRowSkeleton key={i} />)
            ) : displayedLoans.length > 0 ? (
              // Render loan rows
              displayedLoans.map((loan) => {
                const { remaining, remainingInterest, totalRemainingPayments, monthsLeft, isPaidOff } = calculateLoanDetails(loan);
                const progress = loan.amount > 0 ? ((loan.paidAmount || 0) / loan.amount) * 100 : 0;

                return (
                  <TableRow key={loan.id} hover>
                    <TableCell>
                      <Typography fontWeight={500} sx={{ fontSize: '0.875rem' }}>{loan.name}</Typography>
                      <LinearProgress variant="determinate" value={progress} color={isPaidOff ? "success" : "primary"} sx={{ mt: 1, height: 4, borderRadius: 1 }} />
                    </TableCell>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography sx={{ fontSize: '0.875rem' }}>{loan.lender}</Typography></Box></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatCurrency(loan.paidAmount || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatCurrency(remaining)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatCurrency(loan.monthlyPayment || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: monthsLeft === '∞' ? 'error.main' : 'text.primary', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      {monthsLeft === '∞' ? 'Insufficient' : monthsLeft === 0 ? 'Paid' : `${monthsLeft} mo`}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      {Number.isFinite(remainingInterest) ? formatCurrency(remainingInterest) : 'Accruing'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      {Number.isFinite(totalRemainingPayments) ? formatCurrency(totalRemainingPayments) : 'Infinite'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={isPaidOff ? "Paid Off" : (loan.isActive ? "Active" : "Closed")} color={isPaidOff ? "success" : loan.isActive ? "primary" : "default"} size="small" sx={{ fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditModal(loan)} sx={{ p: 1 }}><FiEdit2 size={16} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(loan.id)} color="error" sx={{ p: 1 }}><FiTrash2 size={16} /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Empty state when no loans match filters
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>No loans found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mt: { xs: 2, sm: 3 } }}>
          <IconButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} size="small">
            <FiChevronLeft />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
            Page <strong>{page}</strong> of {totalPages}
          </Typography>
          <IconButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} size="small">
            <FiChevronRight />
          </IconButton>
        </Box>
      )}

      {/* Add/Edit Loan Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fullWidth
        maxWidth="sm"
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
          {editingLoan ? 'Edit Loan' : 'Add New Loan'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 }, pt: 1 }}>
            <TextField 
              label="Loan Name / Purpose" 
              fullWidth 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } } }}
            />
            <TextField 
              label="Lender" 
              fullWidth 
              value={formData.lender} 
              onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } } }}
            />
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="Total Amount" 
                  type="number" 
                  fullWidth 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                    sx: { fontSize: { xs: '0.9375rem', sm: '1rem' } },
                  }}
                  sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="Paid So Far" 
                  type="number" 
                  fullWidth 
                  value={formData.paidAmount} 
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })} 
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                    sx: { fontSize: { xs: '0.9375rem', sm: '1rem' } },
                  }}
                  sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } } }}
                />
              </Grid>
            </Grid>
            <TextField 
              label="Interest Rate (%)" 
              type="number" 
              fullWidth 
              value={formData.interestRate} 
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} 
              InputProps={{ 
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                sx: { fontSize: { xs: '0.9375rem', sm: '1rem' } },
              }}
              helperText="Annual rate"
              sx={{ 
                '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } },
                '& .MuiFormHelperText-root': { fontSize: { xs: '0.75rem', sm: '0.8125rem' } },
              }}
            />
            <TextField 
              label="Monthly EMI" 
              type="number" 
              fullWidth 
              value={formData.monthlyPayment} 
              onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })} 
              InputProps={{ 
                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                sx: { fontSize: { xs: '0.9375rem', sm: '1rem' } },
              }}
              helperText="Fixed monthly payment for accurate months/interest estimates"
              sx={{ 
                '& .MuiInputBase-input': { fontSize: { xs: '0.9375rem', sm: '1rem' } },
                '& .MuiFormHelperText-root': { fontSize: { xs: '0.75rem', sm: '0.8125rem' } },
              }}
            />

            {/* Live preview of calculated values */}
            {formData.amount && (
              <Box sx={{ mt: 2, p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' }, fontWeight: 600, mb: 1.5 }}>Preview</Typography>
                {(() => {
                  const pRemaining = Math.max(0, Number(formData.amount || 0) - Number(formData.paidAmount || 0));
                  const pRate = Number(formData.interestRate || 0) / 100 / 12;
                  const pMonthly = Number(formData.monthlyPayment || 0);
                  let pMonths: number | '∞' = 0;
                  let pInterest = pRemaining * (Number(formData.interestRate || 0) / 100);
                  let pTotal = pRemaining + pInterest;

                  if (pMonthly > 0 && pRemaining > 0) {
                    if (pRate === 0) {
                      pMonths = Math.ceil(pRemaining / pMonthly);
                      pInterest = 0;
                      pTotal = pRemaining;
                    } else {
                      const den = pMonthly - pRemaining * pRate;
                      if (den > 0) {
                        pMonths = Math.ceil(Math.log(pMonthly / den) / Math.log(1 + pRate));
                        pTotal = pMonths * pMonthly;
                        pInterest = pTotal - pRemaining;
                      } else {
                        pMonths = '∞';
                        pInterest = Infinity;
                        pTotal = Infinity;
                      }
                    }
                  }

                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Remaining</Typography>
                        <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>{formatCurrency(pRemaining)}</Typography>
                      </Box>
                      {pMonthly > 0 ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Est. Months Left</Typography>
                            <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>{pMonths === '∞' ? 'Insufficient EMI' : `${pMonths} mo`}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Est. Remaining Interest</Typography>
                            <Typography fontWeight={600} color="warning.main" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>{Number.isFinite(pInterest) ? formatCurrency(pInterest) : 'Accruing'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Est. Total Remaining</Typography>
                            <Typography fontWeight={700} color="error.main" sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>{Number.isFinite(pTotal) ? formatCurrency(pTotal) : 'Infinite'}</Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Est. Interest (simple)</Typography>
                            <Typography fontWeight={600} color="warning.main" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>{formatCurrency(pInterest)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>Total Due</Typography>
                            <Typography fontWeight={700} color="error.main" sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>{formatCurrency(pTotal)}</Typography>
                          </Box>
                        </>
                      )}
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: { xs: 2, sm: 2.5 },
          gap: { xs: 1, sm: 1.5 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}>
          <Button
            onClick={() => setIsModalOpen(false)}
            color="inherit"
            fullWidth
            sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, fontWeight: 500, display: { sm: 'inline-block' }, width: { sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveLoan}
            variant="contained"
            fullWidth
            sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, fontWeight: 600, px: { xs: 3, sm: 4 }, display: { sm: 'inline-block' }, width: { sm: 'auto' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
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
          <DialogContentText sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: 1.6 }}>
            Are you sure you want to delete this loan? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{
          p: { xs: 2, sm: 2.5 },
          gap: { xs: 1, sm: 1.5 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            fullWidth
            sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, fontWeight: 500, display: { sm: 'inline-block' }, width: { sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={isDeleting}
            fullWidth
            sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, fontWeight: 600, px: { xs: 3, sm: 4 }, display: { sm: 'inline-block' }, width: { sm: 'auto' } }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}