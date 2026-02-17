'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import { FiX } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (loan: { 
    name: string; 
    lender: string;
    amount: number;
    interestRate: number;
    emiAmount: number;
    months: number;
  }) => void;
}

export default function AddLoanModal({ isOpen, onClose, onAddLoan }: AddLoanModalProps) {
  const { getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();
  
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [months, setMonths] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a loan name');
      return;
    }
    if (!lender.trim()) {
      setError('Please enter the bank/lender name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid principal amount');
      return;
    }
    if (!interestRate || parseFloat(interestRate) < 0) {
      setError('Please enter a valid interest rate');
      return;
    }
    if (!emiAmount || parseFloat(emiAmount) <= 0) {
      setError('Please enter a valid EMI amount');
      return;
    }
    if (!months || parseInt(months) <= 0) {
      setError('Please enter valid number of months');
      return;
    }
    onAddLoan({ 
      name: name.trim(), 
      lender: lender.trim(),
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      emiAmount: parseFloat(emiAmount),
      months: parseInt(months),
    });
    setName('');
    setLender('');
    setAmount('');
    setInterestRate('');
    setEmiAmount('');
    setMonths('');
    setError(null);
  };

  const handleClose = () => {
    setName('');
    setLender('');
    setAmount('');
    setInterestRate('');
    setEmiAmount('');
    setMonths('');
    setError(null);
    onClose();
  };

  // Calculate interest amount for display
  const calculatedInterest = amount && interestRate 
    ? (parseFloat(amount) * parseFloat(interestRate) / 100).toFixed(2)
    : '0';

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {currencySymbol}
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  Add New Loan
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClose} 
              sx={{ 
                color: 'text.secondary',
                mt: -0.5,
                mr: -1,
              }}
            >
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                autoFocus
                label="Loan Name"
                fullWidth
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Home Loan, Car Loan"
                error={!!error}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <TextField
                label="Bank/Lender"
                fullWidth
                value={lender}
                onChange={(e) => {
                  setLender(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., HDFC Bank"
                error={!!error}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Principal Amount"
                fullWidth
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., 100000"
                error={!!error}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <TextField
                label="Interest Rate"
                fullWidth
                type="number"
                value={interestRate}
                onChange={(e) => {
                  setInterestRate(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., 8.5"
                error={!!error}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>
            {amount && interestRate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                Interest Amount: {currencySymbol}{calculatedInterest} ({interestRate}% of principal)
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="EMI Amount"
                fullWidth
                type="number"
                value={emiAmount}
                onChange={(e) => {
                  setEmiAmount(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., 2500"
                error={!!error}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <TextField
                label="Total Months"
                fullWidth
                type="number"
                value={months}
                onChange={(e) => {
                  setMonths(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., 60"
                error={!!error}
                inputProps={{ min: 1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>
          </Box>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation
            disabled={!name.trim() || !lender.trim() || !amount || !emiAmount || !months}
          >
            Add Loan
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
