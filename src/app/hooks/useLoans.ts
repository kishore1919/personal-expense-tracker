/**
 * Custom hook for managing loan data and operations.
 * Handles CRUD operations, calculations, and state management for loans.
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import type { Loan } from '@/app/types';

/**
 * Calculated loan details including remaining balance, interest, and payoff timeline
 */
interface LoanDetails {
  remaining: number;
  remainingInterest: number;
  totalRemainingPayments: number;
  monthsLeft: number | '∞';
  isPaidOff: boolean;
}

/**
 * Form data state for add/edit loan modal
 */
interface LoanFormData {
  name: string;
  lender: string;
  amount: string;
  paidAmount: string;
  interestRate: string;
  monthlyPayment: string;
}

/**
 * Return type for useLoans hook
 */
interface UseLoansReturn {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  editingLoan: Loan | null;
  searchQuery: string;
  sortBy: 'monthsLeft' | 'totalRemaining' | 'remaining' | 'name' | 'interestRate';
  page: number;
  pageSize: number;
  deleteTarget: string | null;
  isDeleting: boolean;
  formData: LoanFormData;
  filteredAndSortedLoans: Loan[];
  totalPages: number;
  displayedLoans: Loan[];
  totalPrincipal: number;
  totalPaid: number;
  totalRemainingInterest: number;
  totalLiability: number;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'monthsLeft' | 'totalRemaining' | 'remaining' | 'name' | 'interestRate') => void;
  setPage: (page: number) => void;
  setIsModalOpen: (open: boolean) => void;
  setFormData: (data: LoanFormData) => void;
  setDeleteTarget: (target: string | null) => void;
  openAddModal: () => void;
  openEditModal: (loan: Loan) => void;
  closeModals: () => void;
  handleSaveLoan: () => Promise<void>;
  handleDelete: () => Promise<void>;
  calculateLoanDetails: (loan: Loan) => LoanDetails;
  refetch: () => Promise<void>;
}

/**
 * Calculate loan details including remaining balance, interest, and payoff timeline
 * Uses standard loan amortization formula for accurate calculations
 */
function calculateLoanDetails(loan: Loan): LoanDetails {
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
}

const INITIAL_FORM_DATA: LoanFormData = {
  name: '',
  lender: '',
  amount: '',
  paidAmount: '',
  interestRate: '',
  monthlyPayment: '',
};

/**
 * Hook for managing loan data and operations
 */
export function useLoans(): UseLoansReturn {
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
  const [formData, setFormData] = useState<LoanFormData>(INITIAL_FORM_DATA);

  // Reset to page 1 when search, sort, or page size changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, pageSize]);

  // Fetch loans from Firestore when user is authenticated
  const fetchLoans = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
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
          userId: user.uid,
        } satisfies Loan;
      });

      setLoans(loansData);
    } catch (e) {
      console.error('Error loading loans:', e);
      setError('Failed to load loans.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  /**
   * Save loan to Firestore (create new or update existing)
   */
  const handleSaveLoan = useCallback(async () => {
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
        setLoans((prev) => prev.map((l) => l.id === editingLoan.id ? { ...l, ...loanData } : l));
      } else {
        // Create new loan
        const docRef = await addDoc(collection(db, 'loans'), loanData);
        setLoans((prev) => [{ ...loanData, id: docRef.id }, ...prev]);
      }

      // Close modal and reset form
      setIsModalOpen(false);
      setEditingLoan(null);
      setFormData(INITIAL_FORM_DATA);
      setError(null);
    } catch (e) {
      console.error('Error saving loan: ', e);
      setError('Failed to save loan.');
    }
  }, [user, formData, editingLoan]);

  /**
   * Delete a loan from Firestore
   */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'loans', deleteTarget));
      setLoans((prev) => prev.filter((l) => l.id !== deleteTarget));
      setError(null);
    } catch (e) {
      console.error('Error deleting loan:', e);
      setError('Failed to delete loan.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  /**
   * Open modal for adding a new loan
   */
  const openAddModal = useCallback(() => {
    setEditingLoan(null);
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  }, []);

  /**
   * Open modal for editing an existing loan
   */
  const openEditModal = useCallback((loan: Loan) => {
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
  }, []);

  /**
   * Close all modals and reset state
   */
  const closeModals = useCallback(() => {
    setIsModalOpen(false);
    setEditingLoan(null);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  /**
   * Filter and sort loans based on search query and sort criteria
   * Memoized to prevent unnecessary recalculations
   */
  const filteredAndSortedLoans = useMemo(() => {
    // Filter by name or lender
    let result = loans.filter((loan) =>
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

  // Pagination calculations
  const totalFiltered = filteredAndSortedLoans.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const displayedLoans = filteredAndSortedLoans.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Calculate aggregate statistics for summary cards
  const totalPrincipal = useMemo(() => loans.reduce((sum, loan) => sum + loan.amount, 0), [loans]);
  const totalPaid = useMemo(() => loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0), [loans]);

  const totalRemainingInterest = useMemo(() => loans.reduce((sum, loan) => {
    const { remainingInterest } = calculateLoanDetails(loan);
    return sum + (Number.isFinite(remainingInterest) ? remainingInterest : 0);
  }, 0), [loans]);

  const totalLiability = useMemo(() => loans.reduce((sum, loan) => {
    const { totalRemainingPayments } = calculateLoanDetails(loan);
    return sum + (Number.isFinite(totalRemainingPayments) ? totalRemainingPayments : loan.amount - (loan.paidAmount || 0));
  }, 0), [loans]);

  return {
    loans,
    loading,
    error,
    isModalOpen,
    editingLoan,
    searchQuery,
    sortBy,
    page,
    pageSize,
    deleteTarget,
    isDeleting,
    formData,
    filteredAndSortedLoans,
    totalPages,
    displayedLoans,
    totalPrincipal,
    totalPaid,
    totalRemainingInterest,
    totalLiability,
    setSearchQuery,
    setSortBy,
    setPage,
    setIsModalOpen,
    setFormData,
    setDeleteTarget,
    openAddModal,
    openEditModal,
    closeModals,
    handleSaveLoan,
    handleDelete,
    calculateLoanDetails,
    refetch: fetchLoans,
  };
}
