'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Grid,
} from '@mui/material';
import { FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'in' | 'out';
  currentBalance?: number;
  initialExpense?: {
    description: string;
    amount: number;
    type?: 'in' | 'out';
    createdAt?: Date;
    remarks?: string;
    category?: string;
    paymentMode?: string;
  };
  onAddExpense: (expense: {
    description: string;
    amount: number;
    type: 'in' | 'out';
    createdAt: Date;
    remarks?: string;
    category?: string;
    paymentMode?: string;
    attachments?: string[];
  }) => void;
}

const DEFAULT_CATEGORIES = ['Misc', 'Food', 'Medical', 'Travel'];
const MAX_AMOUNT = 99_99_99_999; // 99,99,99,999
const MAX_DECIMAL_PLACES = 2;
const NUMERIC_TOKEN_REGEX = /(?:\d+\.\d*|\.\d+|\d+)/g;
const ALLOWED_AMOUNT_INPUT = /^[0-9+\-*/%.()\s]*$/;

function evaluateAmountExpression(input: string): number | null {
  const source = input.replace(/\s+/g, '');
  if (!source) return null;

  let index = 0;

  const peek = () => source[index];

  const parseNumber = (): number | null => {
    const start = index;
    let hasDot = false;

    while (index < source.length) {
      const ch = source[index];
      if (ch >= '0' && ch <= '9') {
        index += 1;
        continue;
      }
      if (ch === '.') {
        if (hasDot) return null;
        hasDot = true;
        index += 1;
        continue;
      }
      break;
    }

    if (start === index) return null;
    const raw = source.slice(start, index);
    if (raw === '.') return null;
    const dotIndex = raw.indexOf('.');
    if (dotIndex !== -1 && raw.slice(dotIndex + 1).length > MAX_DECIMAL_PLACES) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  const parseExpression = (): number | null => {
    let value = parseTerm();
    if (value === null) return null;

    while (true) {
      const op = peek();
      if (op !== '+' && op !== '-') break;
      index += 1;
      const rhs = parseTerm();
      if (rhs === null) return null;
      value = op === '+' ? value + rhs : value - rhs;
    }

    return value;
  };

  const parseTerm = (): number | null => {
    let value = parseFactor();
    if (value === null) return null;

    while (true) {
      const op = peek();
      if (op !== '*' && op !== '/') break;
      index += 1;
      const rhs = parseFactor();
      if (rhs === null) return null;
      if (op === '/') {
        if (rhs === 0) return null;
        value = value / rhs;
      } else {
        value = value * rhs;
      }
    }

    return value;
  };

  const parseFactor = (): number | null => {
    let value = parseUnary();
    if (value === null) return null;

    while (peek() === '%') {
      value = value / 100;
      index += 1;
    }

    return value;
  };

  const parseUnary = (): number | null => {
    const op = peek();
    if (op === '+' || op === '-') {
      index += 1;
      const value = parseUnary();
      if (value === null) return null;
      return op === '+' ? value : -value;
    }
    return parsePrimary();
  };

  const parsePrimary = (): number | null => {
    if (peek() === '(') {
      index += 1;
      const value = parseExpression();
      if (value === null || peek() !== ')') return null;
      index += 1;
      return value;
    }
    return parseNumber();
  };

  const result = parseExpression();
  if (result === null || index !== source.length || !Number.isFinite(result)) {
    return null;
  }
  return result;
}

function exceedsAmountLimit(input: string, evaluatedResult?: number | null): boolean {
  const compact = input.replace(/\s+/g, '');
  if (!compact) return false;

  const numericTokens = compact.match(NUMERIC_TOKEN_REGEX) ?? [];
  for (const token of numericTokens) {
    const tokenValue = Number(token);
    if (Number.isFinite(tokenValue) && Math.abs(tokenValue) > MAX_AMOUNT) {
      return true;
    }
  }

  const evaluated = evaluatedResult === undefined ? evaluateAmountExpression(compact) : evaluatedResult;
  return evaluated !== null && Math.abs(evaluated) > MAX_AMOUNT;
}

function exceedsDecimalPrecision(input: string): boolean {
  const compact = input.replace(/\s+/g, '');
  if (!compact) return false;

  const numericTokens = compact.match(NUMERIC_TOKEN_REGEX) ?? [];
  return numericTokens.some((token) => {
    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) return false;
    return token.slice(dotIndex + 1).length > MAX_DECIMAL_PLACES;
  });
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onAddExpense,
  initialType,
  currentBalance = 0,
  initialExpense,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>(initialType ?? 'out');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState('Misc');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currency, formatCurrency } = useCurrency();
  const parsedAmount = React.useMemo(() => evaluateAmountExpression(amount), [amount]);
  const isEditMode = Boolean(initialExpense);
  const exceedsDecimalLimit = React.useMemo(() => exceedsDecimalPrecision(amount), [amount]);
  const exceedsMaxAmount = React.useMemo(
    () => exceedsAmountLimit(amount, parsedAmount),
    [amount, parsedAmount]
  );
  const balanceBeforeEntry = React.useMemo(() => {
    if (!initialExpense) return currentBalance;
    const previousSignedAmount = (initialExpense.type ?? 'out') === 'in'
      ? initialExpense.amount
      : -initialExpense.amount;
    return currentBalance - previousSignedAmount;
  }, [currentBalance, initialExpense]);

  // Calculate projected balance after this entry
  const projectedBalance = React.useMemo(() => {
    const amountNum = parsedAmount ?? 0;
    if (type === 'in') {
      return balanceBeforeEntry + amountNum;
    } else {
      return balanceBeforeEntry - amountNum;
    }
  }, [balanceBeforeEntry, parsedAmount, type]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const categoriesData = querySnapshot.docs.map(doc => doc.data().name as string);

        if (categoriesData.length > 0) {
          setAvailableCategories(categoriesData);
          setCategory((prev) => categoriesData.includes(prev) ? prev : categoriesData[0]);
        } else {
          setAvailableCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setAvailableCategories(DEFAULT_CATEGORIES);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      const initialDate = initialExpense.createdAt instanceof Date
        ? initialExpense.createdAt
        : new Date();
      setDescription(initialExpense.description || '');
      setAmount(String(initialExpense.amount ?? ''));
      setType(initialExpense.type ?? 'out');
      setDate(initialDate.toISOString().slice(0, 10));
      setRemarks(initialExpense.remarks || '');
      setCategory(initialExpense.category || 'Misc');
      setPaymentMode(initialExpense.paymentMode || 'Online');
      setErrorMessage(null);
      return;
    }

    setDescription('');
    setAmount('');
    setType(initialType ?? 'out');
    setDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
    setErrorMessage(null);
  }, [isOpen, initialType, initialExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!description || !amount) {
      setErrorMessage('Please provide a description and amount.');
      return;
    }
    if (exceedsDecimalLimit) {
      setErrorMessage('Use at most 2 digits after the decimal point.');
      return;
    }
    if (parsedAmount === null) {
      setErrorMessage('Please enter a valid amount expression.');
      return;
    }
    if (exceedsMaxAmount) {
      setErrorMessage(`Amount cannot exceed ${formatCurrency(MAX_AMOUNT)}.`);
      return;
    }

    const createdAt = new Date(`${date}T00:00:00`);

    setIsSaving(true);
    try {
      const payload: {
        description: string;
        amount: number;
        type: 'in' | 'out';
        createdAt: Date;
        category: string;
        paymentMode: string;
        remarks?: string;
      } = {
        description,
        amount: parsedAmount,
        type,
        createdAt,
        category,
        paymentMode,
      };

      if (remarks && remarks.trim() !== '') {
        payload.remarks = remarks.trim();
      }

      await onAddExpense(payload);
      handleClose();
    } catch (err) {
      console.error('Save failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setErrorMessage(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmountChange = (value: string) => {
    if (!ALLOWED_AMOUNT_INPUT.test(value)) return;
    if (exceedsDecimalPrecision(value)) return;
    if (exceedsAmountLimit(value)) return;

    setAmount(value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('out');
    setDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
    setErrorMessage(null);
    onClose();
  };

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
            <Typography variant="h5" fontWeight={600}>
              {isEditMode ? 'Edit Entry' : 'Add Entry'}
            </Typography>
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
          {/* Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => newType && setType(newType)}
              fullWidth
              sx={{
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: type === 'in' ? 'success.main' : 'error.main',
                    color: 'white',
                    borderColor: type === 'in' ? 'success.main' : 'error.main',
                    '&:hover': {
                      bgcolor: type === 'in' ? 'success.dark' : 'error.dark',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="in">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiTrendingUp size={18} />
                  Cash In
                </Box>
              </ToggleButton>
              <ToggleButton value="out">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiTrendingDown size={18} />
                  Cash Out
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Balance Display */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {isEditMode ? 'Balance before this entry' : 'Current Balance'}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={balanceBeforeEntry >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(balanceBeforeEntry)}
              </Typography>
            </Box>
            {amount && parsedAmount !== null && parsedAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Balance after this entry
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color={projectedBalance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(projectedBalance)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description */}
          <TextField
            id="entry-description"
            label="Description"
            fullWidth
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Groceries, Rent, Salary"
            sx={{ mb: 3 }}
          />

          {/* Amount and Date */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 7 }}>
              <TextField
                id="entry-amount"
                label={`Amount (${currency})`}
                type="text"
                fullWidth
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="e.g. 10+3 or 50*10%"
                error={Boolean(amount) && (exceedsDecimalLimit || parsedAmount === null || exceedsMaxAmount)}
                helperText={
                  amount
                    ? exceedsDecimalLimit
                      ? 'Only up to 2 decimal places are allowed.'
                      : parsedAmount === null
                      ? 'Invalid expression. Use +, -, *, /, %, and parentheses.'
                      : exceedsMaxAmount
                        ? `Max allowed is ${formatCurrency(MAX_AMOUNT)}.`
                      : `Calculated: ${formatCurrency(parsedAmount)}`
                    : 'You can type formulas like 10+3, 10+4-7, 10+6/9+10-3, or 10%.'
                }
                inputProps={{
                  inputMode: 'decimal',
                }}
              />
            </Grid>
            <Grid size={{ xs: 5 }}>
              <TextField
                id="entry-date"
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Category and Payment Mode */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                id="entry-category"
                select
                label="Category"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                id="entry-paymentMode"
                select
                label="Payment Mode"
                fullWidth
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <MenuItem value="Online">Online</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Remarks */}
          <TextField
            id="entry-remarks"
            label="Remarks (optional)"
            fullWidth
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any additional details..."
            sx={{ mb: 2 }}
          />

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 1 }}>{errorMessage}</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation 
            disabled={isSaving || !description || !amount || exceedsDecimalLimit || parsedAmount === null || exceedsMaxAmount}
            color={type === 'in' ? 'success' : 'error'}
          >
            {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Entry' : 'Save Entry')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
