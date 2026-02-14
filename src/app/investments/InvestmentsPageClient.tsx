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
} from '@mui/material';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiPercent,
  FiX,
  FiArrowUp,
  FiArrowDown,
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
import { useCurrency } from '../context/CurrencyContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loading from '../components/Loading';

interface FixedDeposit {
  id: string;
  fdNumber: string;
  bankName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: Date;
  maturityDate: Date;
  maturityAmount: number;
  notes?: string;
}

export default function InvestmentsPage() {
  const [user] = useAuthState(auth);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFD, setEditingFD] = useState<FixedDeposit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FixedDeposit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatCurrency } = useCurrency();

  // Form state
  const [fdNumber, setFdNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const fdsQuery = query(collection(db, 'fixedDeposits'), where('userId', '==', user.uid));
      const fdsSnapshot = await getDocs(fdsQuery);
      
      const fdsData: FixedDeposit[] = fdsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fdNumber: data.fdNumber || '',
          bankName: data.bankName || '',
          principalAmount: data.principalAmount || 0,
          interestRate: data.interestRate || 0,
          tenureMonths: data.tenureMonths || 0,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
          maturityDate: data.maturityDate?.toDate ? data.maturityDate.toDate() : new Date(),
          maturityAmount: data.maturityAmount || 0,
          notes: data.notes || '',
        };
      });

      setFixedDeposits(fdsData);
    } catch (err) {
      console.error('Error fetching fixed deposits:', err);
      setError('Failed to load fixed deposit data.');
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
  const totalPrincipal = fixedDeposits.reduce((sum, fd) => sum + fd.principalAmount, 0);
  const totalMaturityValue = fixedDeposits.reduce((sum, fd) => sum + fd.maturityAmount, 0);
  const totalInterestEarned = totalMaturityValue - totalPrincipal;
  const averageRate = fixedDeposits.length > 0 
    ? fixedDeposits.reduce((sum, fd) => sum + fd.interestRate, 0) / fixedDeposits.length 
    : 0;

  // Calculate maturity
  const calculateMaturityAmount = (principal: number, rate: number, months: number): number => {
    const annualRate = rate / 100;
    const years = months / 12;
    return principal * (1 + annualRate * years);
  };

  // Handle add/edit fixed deposit
  const handleOpenModal = (fd?: FixedDeposit) => {
    if (fd) {
      setEditingFD(fd);
      setFdNumber(fd.fdNumber);
      setBankName(fd.bankName);
      setPrincipalAmount(fd.principalAmount.toString());
      setInterestRate(fd.interestRate.toString());
      setTenureMonths(fd.tenureMonths.toString());
      setStartDate(fd.startDate.toISOString().split('T')[0]);
      setMaturityAmount(fd.maturityAmount.toString());
      setNotes(fd.notes || '');
    } else {
      setEditingFD(null);
      setFdNumber('');
      setBankName('');
      setPrincipalAmount('');
      setInterestRate('');
      setTenureMonths('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setMaturityAmount('');
      setNotes('');
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFD(null);
    setFdNumber('');
    setBankName('');
    setPrincipalAmount('');
    setInterestRate('');
    setTenureMonths('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setMaturityAmount('');
    setNotes('');
    setError(null);
  };

  const handleCalculateMaturity = () => {
    const principal = Number(principalAmount) || 0;
    const rate = Number(interestRate) || 0;
    const months = Number(tenureMonths) || 0;
    
    if (principal > 0 && rate > 0 && months > 0) {
      const maturity = calculateMaturityAmount(principal, rate, months);
      setMaturityAmount(maturity.toFixed(2));
    }
  };

  const handleSaveFD = async () => {
    if (!user || !bankName || !principalAmount || !interestRate || !tenureMonths) {
      setError('Please fill in all required fields.');
      return;
    }

    const principal = Number(principalAmount);
    const rate = Number(interestRate);
    const months = Number(tenureMonths);
    const maturity = Number(maturityAmount) || calculateMaturityAmount(principal, rate, months);

    if (isNaN(principal) || isNaN(rate) || isNaN(months) || principal <= 0 || rate <= 0 || months <= 0) {
      setError('Please enter valid values.');
      return;
    }

    const start = new Date(startDate);
    const maturityDate = new Date(start);
    maturityDate.setMonth(maturityDate.getMonth() + months);

    try {
      if (editingFD) {
        await updateDoc(doc(db, 'fixedDeposits', editingFD.id), {
          fdNumber,
          bankName,
          principalAmount: principal,
          interestRate: rate,
          tenureMonths: months,
          startDate: start,
          maturityDate,
          maturityAmount: maturity,
          notes,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'fixedDeposits'), {
          userId: user.uid,
          fdNumber,
          bankName,
          principalAmount: principal,
          interestRate: rate,
          tenureMonths: months,
          startDate: start,
          maturityDate,
          maturityAmount: maturity,
          notes,
          createdAt: new Date(),
        });
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving fixed deposit:', err);
      setError('Failed to save fixed deposit. Please try again.');
    }
  };

  // Handle delete
  const handleDeleteFD = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'fixedDeposits', deleteTarget.id));
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting fixed deposit:', err);
      setError('Failed to delete fixed deposit.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isMatured = (maturityDate: Date) => {
    return new Date() >= maturityDate;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
              <FiDollarSign size={24} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Fixed Deposits
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your fixed deposits and maturity amounts
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Principal
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {formatCurrency(totalPrincipal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Maturity Value
              </Typography>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {formatCurrency(totalMaturityValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Interest Earned
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiArrowUp color="green" size={24} />
                <Typography 
                  variant="h4" 
                  fontWeight={600} 
                  color="success.main"
                >
                  {formatCurrency(totalInterestEarned)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiPercent size={20} />
                <Typography variant="h4" fontWeight={600}>
                  {averageRate.toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fixed Deposits List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Your Fixed Deposits
            </Typography>
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={() => handleOpenModal()}
            >
              Add FD
            </Button>
          </Box>

          {fixedDeposits.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.default',
              }}
            >
              <FiDollarSign size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                No fixed deposits yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start tracking your fixed deposits to monitor your returns.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FiPlus />}
                onClick={() => handleOpenModal()}
              >
                Add Your First FD
              </Button>
            </Paper>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>FD Number</TableCell>
                    <TableCell>Bank Name</TableCell>
                    <TableCell align="right">Principal</TableCell>
                    <TableCell align="right">Interest Rate</TableCell>
                    <TableCell>Tenure</TableCell>
                    <TableCell align="right">Maturity Value</TableCell>
                    <TableCell>Maturity Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fixedDeposits.map((fd) => {
                    const matured = isMatured(fd.maturityDate);
                    const interestEarned = fd.maturityAmount - fd.principalAmount;

                    return (
                      <TableRow key={fd.id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{fd.fdNumber || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{fd.bankName}</Typography>
                          {fd.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {fd.notes.substring(0, 30)}{fd.notes.length > 30 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(fd.principalAmount)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            icon={<FiPercent size={14} />}
                            label={`${fd.interestRate}%`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiCalendar size={14} />
                            {fd.tenureMonths} months
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="primary.main">
                            {formatCurrency(fd.maturityAmount)}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            +{formatCurrency(interestEarned)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {fd.maturityDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={matured ? 'Matured' : 'Active'}
                            color={matured ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(fd)}
                            sx={{ mr: 1 }}
                          >
                            <FiEdit2 size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(fd)}
                            color="error"
                          >
                            <FiTrash2 size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit FD Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFD ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="FD Number (Optional)"
              value={fdNumber}
              onChange={(e) => setFdNumber(e.target.value)}
              fullWidth
              placeholder="e.g., FD001, 123456789"
            />

            <TextField
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              fullWidth
              placeholder="e.g., SBI, HDFC Bank"
              required
            />

            <TextField
              label="Principal Amount"
              type="number"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              fullWidth
              placeholder="Amount invested"
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Interest Rate (% p.a.)"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                fullWidth
                placeholder="e.g., 7.5"
                required
                InputProps={{
                  endAdornment: <FiPercent size={16} style={{ opacity: 0.5 }} />,
                }}
              />

              <TextField
                label="Tenure (Months)"
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                fullWidth
                placeholder="e.g., 12"
                required
              />
            </Box>

            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Maturity Amount"
                type="number"
                value={maturityAmount}
                onChange={(e) => setMaturityAmount(e.target.value)}
                fullWidth
                placeholder="Auto-calculated"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
              <Button 
                variant="outlined" 
                onClick={handleCalculateMaturity}
                sx={{ height: 56 }}
              >
                Calculate
              </Button>
            </Box>

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Additional notes (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} startIcon={<FiX />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveFD} 
            variant="contained"
            disabled={!bankName || !principalAmount || !interestRate || !tenureMonths}
          >
            {editingFD ? 'Update' : 'Add'} FD
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this fixed deposit from {deleteTarget?.bankName}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteTarget(null)} 
            disabled={isDeleting}
            startIcon={<FiX />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteFD} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
