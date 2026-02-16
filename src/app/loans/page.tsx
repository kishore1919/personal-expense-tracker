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
  FiPercent,
  FiCreditCard,
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
  const [pageSize, setPageSize] = useState<number>(10);

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
  const remainingPrincipal = totalPrincipal - totalPaid;

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
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  const displayedLoans = filteredAndSortedLoans.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Summary statistics cards - only show when not loading */}
      {!loading && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'primary.main' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)', color: 'primary.main', display: 'flex' }}>
                    <FiDollarSign size={18} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Total Principal</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700}>{formatCurrency(totalPrincipal)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'success.main' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: 'success.main', display: 'flex' }}>
                    <FiCheckCircle size={18} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Total Paid</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="success.main">{formatCurrency(totalPaid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'warning.main' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: 'warning.main', display: 'flex' }}>
                    <FiTrendingUp size={18} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Rem. Interest</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="warning.main">{formatCurrency(totalRemainingInterest)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: 'error.main', display: 'flex' }}>
                    <FiAlertCircle size={18} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Total Due</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="error.main">{formatCurrency(totalLiability)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Principal + future interest</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and filter controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <TextField
              placeholder="Search by loan name or lender..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <MenuItem value="monthsLeft">Sort By: Est. Months Left (longest first)</MenuItem>
                <MenuItem value="totalRemaining">Sort By: Est. Total Remaining Payments</MenuItem>
                <MenuItem value="remaining">Sort By: Remaining Principal</MenuItem>
                <MenuItem value="name">Sort By: Name</MenuItem>
                <MenuItem value="interestRate">Sort By: Interest Rate</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={openAddModal} startIcon={<FiPlus />}>
              Add Loan
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error display */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Loans data table */}
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { px: 1, py: 1.5 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600 }}>Loan Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Lender</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Principal</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Paid</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">EMI</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Months</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Interest</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>Total Due</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
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
                      <Typography fontWeight={500}>{loan.name}</Typography>
                      <LinearProgress variant="determinate" value={progress} color={isPaidOff ? "success" : "primary"} sx={{ mt: 1, height: 4, borderRadius: 1 }} />
                    </TableCell>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{loan.lender}</Box></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(loan.paidAmount || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(remaining)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(loan.monthlyPayment || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: monthsLeft === '∞' ? 'error.main' : 'text.primary', whiteSpace: 'nowrap' }}>
                      {monthsLeft === '∞' ? 'Insufficient' : monthsLeft === 0 ? 'Paid' : `${monthsLeft} mo`}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {Number.isFinite(remainingInterest) ? formatCurrency(remainingInterest) : 'Accruing'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>
                      {Number.isFinite(totalRemainingPayments) ? formatCurrency(totalRemainingPayments) : 'Infinite'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={isPaidOff ? "Paid Off" : (loan.isActive ? "Active" : "Closed")} color={isPaidOff ? "success" : loan.isActive ? "primary" : "default"} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditModal(loan)}><FiEdit2 /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(loan.id)} color="error"><FiTrash2 /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Empty state when no loans match filters
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="h6" color="text.secondary">No loans found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <IconButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} size="small">
            <FiChevronLeft />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Page <strong>{page}</strong> of {totalPages}
          </Typography>
          <IconButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} size="small">
            <FiChevronRight />
          </IconButton>
        </Box>
      )}

      {/* Add/Edit Loan Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Loan Name / Purpose" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Lender" fullWidth value={formData.lender} onChange={(e) => setFormData({ ...formData, lender: e.target.value })} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField label="Total Amount" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }} /></Grid>
              <Grid size={{ xs: 6 }}><TextField label="Paid So Far" type="number" fullWidth value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }} /></Grid>
            </Grid>
            <TextField label="Interest Rate (%)" type="number" fullWidth value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Annual rate" />
            <TextField label="Monthly EMI" type="number" fullWidth value={formData.monthlyPayment} onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }} helperText="Fixed monthly payment for accurate months/interest estimates" />

            {/* Live preview of calculated values */}
            {formData.amount && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Preview</Typography>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Remaining</Typography><Typography fontWeight={600}>{formatCurrency(pRemaining)}</Typography></Box>
                      {pMonthly > 0 ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Est. Months Left</Typography><Typography fontWeight={600}>{pMonths === '∞' ? 'Insufficient EMI' : `${pMonths} mo`}</Typography></Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Est. Remaining Interest</Typography><Typography fontWeight={600} color="warning.main">{Number.isFinite(pInterest) ? formatCurrency(pInterest) : 'Accruing'}</Typography></Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" fontWeight={600}>Est. Total Remaining</Typography><Typography fontWeight={700} color="error.main">{Number.isFinite(pTotal) ? formatCurrency(pTotal) : 'Infinite'}</Typography></Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Est. Interest (simple)</Typography><Typography fontWeight={600} color="warning.main">{formatCurrency(pInterest)}</Typography></Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" fontWeight={600}>Total Due</Typography><Typography fontWeight={700} color="error.main">{formatCurrency(pTotal)}</Typography></Box>
                        </>
                      )}
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveLoan} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this loan? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={isDeleting}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}