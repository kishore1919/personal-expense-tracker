'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import type { Loan } from '@/app/types';
import {
  getUserLoans,
  createLoan as createLoanService,
  updateLoan as updateLoanService,
  deleteLoan as deleteLoanService,
  calculateLoanStats,
} from '@/app/lib/firestore/loans';

export interface UseLoansReturn {
  // Data state
  loans: Loan[];
  loading: boolean;
  error: string | null;

  // Filtered and sorted data
  filteredLoans: Loan[];
  displayedLoans: Loan[];
  totalPages: number;
  currentPage: number;

  // Statistics
  stats: ReturnType<typeof calculateLoanStats>;

  // Modal state
  isModalOpen: boolean;
  editingLoan: Loan | null;
  formData: LoanFormData;

  // Search and sort
  searchQuery: string;
  sortBy: LoanSortOption;

  // Delete state
  deleteTarget: string | null;
  isDeleting: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: LoanSortOption) => void;
  setPage: (page: number) => void;
  openAddModal: () => void;
  openEditModal: (loan: Loan) => void;
  closeModal: () => void;
  setFormData: (data: LoanFormData) => void;
  saveLoan: () => Promise<void>;
  deleteLoan: () => Promise<void>;
  cancelDelete: () => void;
  confirmDelete: (loanId: string) => void;
  refreshLoans: () => Promise<void>;
}

export interface LoanFormData {
  name: string;
  lender: string;
  amount: string;
  paidAmount: string;
  interestRate: string;
  monthlyPayment: string;
}

export type LoanSortOption = 'monthsLeft' | 'totalRemaining' | 'remaining' | 'name' | 'interestRate';

const DEFAULT_FORM_DATA: LoanFormData = {
  name: '',
  lender: '',
  amount: '',
  paidAmount: '',
  interestRate: '',
  monthlyPayment: '',
};

const PAGE_SIZE = 10;

/**
 * Calculate loan details including remaining balance, interest, and payoff timeline.
 */
export function calculateLoanDetails(loan: Loan) {
  const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
  const interestRate = loan.interestRate ?? 0;
  const monthlyRate = interestRate ? interestRate / 100 / 12 : 0;
  const monthly = loan.monthlyPayment || 0;

  let monthsLeft: number | '∞' = 0;
  let remainingInterest = 0;
  let totalRemainingPayments = remaining;

  const isPaidOff = remaining <= 0;

  if (!isPaidOff && monthly > 0) {
    if (monthlyRate === 0) {
      monthsLeft = Math.ceil(remaining / monthly);
      remainingInterest = 0;
      totalRemainingPayments = remaining;
    } else {
      const denominator = monthly - remaining * monthlyRate;
      if (denominator > 0) {
        const exact = Math.log(monthly / denominator) / Math.log(1 + monthlyRate);
        monthsLeft = Math.ceil(exact);
        totalRemainingPayments = monthsLeft * monthly;
        remainingInterest = totalRemainingPayments - remaining;
      } else {
        monthsLeft = '∞';
        remainingInterest = Infinity;
        totalRemainingPayments = Infinity;
      }
    }
  } else if (!isPaidOff) {
    remainingInterest = remaining * (interestRate / 100);
    totalRemainingPayments = remaining + remainingInterest;
  }

  return { remaining, remainingInterest, totalRemainingPayments, monthsLeft, isPaidOff };
}

/**
 * Custom hook for managing loans data and operations.
 * Handles fetching, CRUD operations, filtering, sorting, and pagination.
 */
export function useLoans(user: User | null): UseLoansReturn {
  // Data state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormDataState] = useState<LoanFormData>(DEFAULT_FORM_DATA);

  // Search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<LoanSortOption>('monthsLeft');

  // Pagination
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  // Fetch loans from Firestore
  const fetchLoans = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userLoans = await getUserLoans(user.uid);
      setLoans(userLoans);
      setError(null);
    } catch (err) {
      console.error('Error loading loans:', err);
      setError('Failed to load loans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Filter and sort loans
  const filteredLoans = useMemo(() => {
    let result = loans.filter(
      (loan) =>
        loan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.lender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);

      if (sortBy === 'remaining') {
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
        const aVal = Number.isFinite(aCalc.totalRemainingPayments)
          ? aCalc.totalRemainingPayments
          : Infinity;
        const bVal = Number.isFinite(bCalc.totalRemainingPayments)
          ? bCalc.totalRemainingPayments
          : Infinity;
        return bVal - aVal;
      }

      if (sortBy === 'interestRate') return b.interestRate - a.interestRate;

      return 0;
    });

    return result;
  }, [loans, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
  const displayedLoans = filteredLoans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page if it exceeds total pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  // Calculate statistics
  const stats = useMemo(() => calculateLoanStats(loans), [loans]);

  // Actions
  const openAddModal = useCallback(() => {
    setEditingLoan(null);
    setFormDataState(DEFAULT_FORM_DATA);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((loan: Loan) => {
    setEditingLoan(loan);
    setFormDataState({
      name: loan.name,
      lender: loan.lender,
      amount: loan.amount.toString(),
      paidAmount: (loan.paidAmount ?? 0).toString(),
      interestRate: (loan.interestRate ?? 0).toString(),
      monthlyPayment: (loan.monthlyPayment ?? 0).toString(),
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLoan(null);
    setFormDataState(DEFAULT_FORM_DATA);
  }, []);

  const setFormData = useCallback((data: LoanFormData) => {
    setFormDataState(data);
  }, []);

  const refreshLoans = useCallback(async () => {
    await fetchLoans();
  }, [fetchLoans]);

  const saveLoan = useCallback(async () => {
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
      };

      if (editingLoan) {
        await updateLoanService(editingLoan.id, loanData);
        setLoans((prev) =>
          prev.map((l) => (l.id === editingLoan.id ? { ...l, ...loanData } : l))
        );
      } else {
        await createLoanService(user.uid, loanData);
        await refreshLoans();
      }

      closeModal();
      setError(null);
    } catch (err) {
      console.error('Error saving loan:', err);
      setError('Failed to save loan. Please try again.');
    }
  }, [user, formData, editingLoan, closeModal, refreshLoans]);

  const deleteLoan = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteLoanService(deleteTarget);
      setLoans((prev) => prev.filter((l) => l.id !== deleteTarget));
      setError(null);
    } catch (err) {
      console.error('Error deleting loan:', err);
      setError('Failed to delete loan. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback((loanId: string) => {
    setDeleteTarget(loanId);
  }, []);

  return {
    // Data state
    loans,
    loading,
    error,

    // Filtered and sorted data
    filteredLoans,
    displayedLoans,
    totalPages,
    currentPage: page,

    // Statistics
    stats,

    // Modal state
    isModalOpen,
    editingLoan,
    formData,

    // Search and sort
    searchQuery,
    sortBy,

    // Delete state
    deleteTarget,
    isDeleting,

    // Actions
    setSearchQuery,
    setSortBy,
    setPage,
    openAddModal,
    openEditModal,
    closeModal,
    setFormData,
    saveLoan,
    deleteLoan,
    cancelDelete,
    confirmDelete,
    refreshLoans,
  };
}
