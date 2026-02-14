/**
 * AddExpenseModal Component - Modal dialog for adding or editing expense entries.
 * 
 * This component provides a comprehensive form for creating or editing expense/income entries.
 * Features include:
 * - Toggle between Cash In (income) and Cash Out (expense)
 * - Calculator-like amount input supporting expressions (e.g., "10+3", "50*10%")
 * - Date and time selection
 * - Category selection (with user-defined categories from Firestore)
 * - Payment mode selection
 * - Real-time balance preview (current and projected)
 * - Form validation with helpful error messages
 * 
 * @component
 * @module AddExpenseModal
 * 
 * @example
 * <AddExpenseModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onAddExpense={handleAddExpense}
 *   initialType="out"
 * />
 */
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Props for AddExpenseModal component
 * @interface AddExpenseModalProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Callback when modal should close
 * @property {'in' | 'out} [initialType] - Initial entry type
 * @property {number} [currentBalance] - Current balance for preview
 * @property {Object} [initialExpense] - Existing expense for edit mode
 * @property {Function} onAddExpense - Callback with expense data
 */
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
  }, keepOpen?: boolean) => Promise<void> | void;
}

/**
 * Default expense categories provided to all users
 * @constant {string[]}
 */
const CORE_CATEGORIES = ['Food', 'Travel', 'Medical', 'Shopping', 'Bills', 'Misc'];

/**
 * Maximum allowed amount (99,99,99,999)
 * @constant {number}
 */
const MAX_AMOUNT = 99_99_99_999;

/**
 * Maximum decimal places allowed in amounts
 * @constant {number}
 */
const MAX_DECIMAL_PLACES = 2;

/**
 * Regex to extract numeric tokens from expressions
 * @constant {RegExp}
 */
const NUMERIC_TOKEN_REGEX = /(?:\d+\.\d*|\.\d+|\d+)/g;

/**
 * Allowed characters in amount input field
 * @constant {RegExp}
 */
const ALLOWED_AMOUNT_INPUT = /^[0-9+\-*/%.()\s]*$/;

/**
 * Gets the current local date and time as ISO-like strings.
 * Used for default date/time values in the form.
 * 
 * @param {Date} [d= new Date()] - Date object to convert
 * @returns {{ date: string, time: string }} Formatted date and time strings
 */
function getLocalDateTime(d: Date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
}

// Lightweight expression evaluator for calculator-like amount input.
/**
 * Evaluates mathematical expressions in the amount field.
 * Supports: +, -, *, /, %, parentheses, and decimal numbers.
 * 
 * @param {string} input - Mathematical expression string
 * @returns {number | null} Evaluated result or null if invalid
 * 
 * @example
 * evaluateAmountExpression('10+3');    // 13
 * evaluateAmountExpression('50*10%');   // 5
 * evaluateAmountExpression('(10+5)*2'); // 30
 */
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

/**
 * Checks if the expression exceeds the maximum allowed amount.
 * 
 * @param {string} input - Expression to check
 * @param {number | null} [evaluatedResult] - Pre-evaluated result
 * @returns {boolean} True if amount exceeds limit
 */
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

/**
 * Checks if the expression has too many decimal places.
 * 
 * @param {string} input - Expression to check
 * @returns {boolean} True if decimal precision is exceeded
 */
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

/**
 * Main component for adding or editing expense entries.
 * Provides a comprehensive form with real-time validation and balance preview.
 * 
 * @param {AddExpenseModalProps} props - Component props
 * @returns {JSX.Element} Modal dialog component
 */
export default function AddExpenseModal({
  isOpen,
  onClose,
  onAddExpense,
  initialType,
  currentBalance = 0,
  initialExpense,
}: AddExpenseModalProps) {
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>(initialType ?? 'out');
  const [date, setDate] = useState(() => getLocalDateTime().date);
  const [time, setTime] = useState(() => getLocalDateTime().time);
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState('Misc');
  const [paymentMode, setPaymentMode] = useState('Online');
  
  // Data state
  const [availableCategories, setAvailableCategories] = useState<string[]>(CORE_CATEGORIES);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Auth and theme
  const [user] = useAuthState(auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currency, formatCurrency } = useCurrency();
  
  // Computed values
  const parsedAmount = React.useMemo(() => evaluateAmountExpression(amount), [amount]);
  const isEditMode = Boolean(initialExpense);
  const exceedsDecimalLimit = React.useMemo(() => exceedsDecimalPrecision(amount), [amount]);
  const exceedsMaxAmount = React.useMemo(
    () => exceedsAmountLimit(amount, parsedAmount),
    [amount, parsedAmount]
  );
  
  // Calculate balance before this entry (for edit mode)
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

  // Fetch user-defined categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'categories'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userCategories = querySnapshot.docs.map(doc => doc.data().name as string);

        // Merge CORE_CATEGORIES with userCategories and remove duplicates, then sort
        const merged = Array.from(new Set([...CORE_CATEGORIES, ...userCategories])).sort();
        setAvailableCategories(merged);

        // If current category is not in the merged list, reset it to 'Misc' or the first item
        setCategory((prev) => {
          if (merged.includes(prev)) return prev;
          return merged.includes('Misc') ? 'Misc' : merged[0];
        });
      } catch (err) {
        console.error("Error fetching categories:", err);
        setAvailableCategories(CORE_CATEGORIES);
      }
    };

    if (isOpen && user) {
      fetchCategories();
    }
  }, [isOpen, user]);

  // Reset form when modal opens/closes or initial expense changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      const initialDate = initialExpense.createdAt instanceof Date
        ? initialExpense.createdAt
        : new Date();
      setDescription(initialExpense.description || '');
      setAmount(String(initialExpense.amount ?? ''));
      setType(initialExpense.type ?? 'out');
      
      const local = getLocalDateTime(initialDate);
      setDate(local.date);
      setTime(local.time);
      
      setRemarks(initialExpense.remarks || '');
      setCategory(initialExpense.category || 'Misc');
      setPaymentMode(initialExpense.paymentMode || 'Online');
      setErrorMessage(null);
      return;
    }

    const { date: localDate, time: localTime } = getLocalDateTime();
    setDescription('');
    setAmount('');
    setType(initialType ?? 'out');
    setDate(localDate);
    setTime(localTime);
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
    setErrorMessage(null);
  }, [isOpen, initialType, initialExpense]);

  /**
   * Handles form submission and saves the expense entry.
   * Validates all fields before saving.
   * 
   * @param {boolean} [keepOpen=false] - Whether to keep modal open after saving
   */
  const handleSave = async (keepOpen = false) => {
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

    const createdAt = new Date(`${date}T${time}`);

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

      await onAddExpense(payload, keepOpen);

      if (keepOpen && !isEditMode) {
        // Prepare form for next entry without closing modal
        setDescription('');
        setAmount('');
        setRemarks('');
        setErrorMessage(null);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Save failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setErrorMessage(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles form submit event.
   * Prevents default and triggers save with keepOpen=false.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave(false);
  }; 

  /**
   * Handles amount input changes with validation.
   * Filters out invalid characters and validates limits.
   */
  const handleAmountChange = (value: string) => {
    if (!ALLOWED_AMOUNT_INPUT.test(value)) return;
    if (exceedsDecimalPrecision(value)) return;
    if (exceedsAmountLimit(value)) return;

    setAmount(value);
    if (errorMessage) setErrorMessage(null);
  };

  /**
   * Resets form state and closes the modal.
   */
  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('out');
    const { date: localDate } = getLocalDateTime();
    setDate(localDate);
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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogTitle sx={{ p: { xs: 2, sm: 3 }, pb: 0 }}>
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

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, flexGrow: 1 }}>
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
                  py: { xs: 1, sm: 1.5 },
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
                  Projected Balance
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

          {/* Amount (moved after description) */}
          <Box sx={{ mb: 3 }}>
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
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  padding: '10px 14px',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.95rem',
                },
              }}
            />
          </Box>

          {/* Date and Time (same row, equal size) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                id="entry-date"
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  // If creating a new entry and date is today, update time to local time
                  if (!initialExpense) {
                    const { date: today, time: nowTime } = getLocalDateTime();
                    if (newDate === today) {
                      setTime(nowTime);
                    }
                  }
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                id="entry-time"
                label="Time"
                type="time"
                fullWidth
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
            </Grid>
          </Grid>

          {/* Category and Payment Mode */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id="entry-category"
                select
                label="Category"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxHeight: 250,
                      },
                    },
                  },
                }}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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

        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, flexDirection: isMobile ? 'column-reverse' : 'row', gap: 1 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSaving} fullWidth={isMobile}>
            Cancel
          </Button>
          {!isEditMode && (
            <Button
              type="button"
              variant="outlined"
              disableElevation
              fullWidth={isMobile}
              disabled={isSaving || !description || !amount || exceedsDecimalLimit || parsedAmount === null || exceedsMaxAmount}
              onClick={() => handleSave(true)}
              color={type === 'in' ? 'success' : 'error'}
            >
              {isSaving ? 'Saving...' : 'Add & Save Another'}
            </Button>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation 
            fullWidth={isMobile}
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
