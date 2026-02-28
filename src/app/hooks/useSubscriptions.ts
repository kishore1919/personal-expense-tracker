/**
 * Custom hook for managing subscription data and operations.
 * Handles CRUD operations, calculations, and state management for subscriptions.
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import type { Subscription } from '@/app/types';

/**
 * Form data state for add/edit subscription modal
 */
interface SubscriptionFormData {
  name: string;
  amount: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  category: string;
  status: 'active' | 'paused' | 'cancelled';
}

/**
 * Return type for useSubscriptions hook
 */
interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  editingSub: Subscription | null;
  searchQuery: string;
  sortBy: 'name' | 'amount' | 'nextBillingDate';
  page: number;
  pageSize: number;
  deleteTarget: string | null;
  isDeleting: boolean;
  formData: SubscriptionFormData;
  filteredAndSorted: Subscription[];
  totalPages: number;
  displayedSubs: Subscription[];
  activeSubs: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'name' | 'amount' | 'nextBillingDate') => void;
  setPage: (page: number) => void;
  setIsModalOpen: (open: boolean) => void;
  setFormData: (data: SubscriptionFormData) => void;
  setDeleteTarget: (target: string | null) => void;
  openAddModal: () => void;
  openEditModal: (sub: Subscription) => void;
  closeModals: () => void;
  handleSaveSub: () => Promise<void>;
  handleDelete: () => Promise<void>;
  calculateNextBillingDate: (startDate: string, cycle: 'weekly' | 'monthly' | 'yearly') => Date;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error';
  refetch: () => Promise<void>;
}

const INITIAL_FORM_DATA: SubscriptionFormData = {
  name: '',
  amount: '',
  billingCycle: 'monthly',
  startDate: '',
  category: 'OTT',
  status: 'active',
};

/**
 * Hook for managing subscription data and operations
 */
export function useSubscriptions(): UseSubscriptionsReturn {
  const [user] = useAuthState(auth);

  // Subscription data state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Modal and editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'nextBillingDate'>('nextBillingDate');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Form state for add/edit modal
  const [formData, setFormData] = useState<SubscriptionFormData>(INITIAL_FORM_DATA);

  // Reset to page 1 when search, sort, or page size changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, pageSize]);

  // Fetch subscriptions from Firestore when user is authenticated
  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const subsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed',
          amount: Number(data.amount) || 0,
          billingCycle: data.billingCycle || 'monthly',
          startDate: data.startDate || '',
          category: data.category || 'OTT',
          status: data.status || 'active',
          createdAt: data.createdAt,
          userId: user.uid,
        } satisfies Subscription;
      });

      setSubscriptions(subsData);
    } catch (e) {
      console.error('Error loading subscriptions:', e);
      setError('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  /**
   * Save subscription to Firestore (create new or update existing)
   */
  const handleSaveSub = useCallback(async () => {
    if (!user) return;
    if (!formData.name || !formData.amount || !formData.startDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const subData = {
        name: formData.name,
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        category: formData.category,
        status: formData.status,
        updatedAt: new Date(),
        userId: user.uid,
      };

      if (editingSub) {
        const subRef = doc(db, 'subscriptions', editingSub.id);
        await updateDoc(subRef, subData);
        setSubscriptions((prev) => prev.map((s) => s.id === editingSub.id ? { ...s, ...subData, id: editingSub.id } : s));
      } else {
        const fullData = { ...subData, createdAt: new Date() };
        const docRef = await addDoc(collection(db, 'subscriptions'), fullData);
        setSubscriptions((prev) => [{ ...fullData, id: docRef.id }, ...prev]);
      }

      setIsModalOpen(false);
      setEditingSub(null);
      setFormData(INITIAL_FORM_DATA);
      setError(null);
    } catch (e) {
      console.error('Error saving subscription: ', e);
      setError('Failed to save subscription.');
    }
  }, [user, formData, editingSub]);

  /**
   * Delete a subscription from Firestore
   */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'subscriptions', deleteTarget));
      setSubscriptions((prev) => prev.filter((s) => s.id !== deleteTarget));
      setError(null);
    } catch (e) {
      console.error('Error deleting subscription:', e);
      setError('Failed to delete subscription.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  /**
   * Open modal for adding a new subscription
   */
  const openAddModal = useCallback(() => {
    setEditingSub(null);
    const dateStr = new Date().toISOString().split('T')[0];
    setFormData({ ...INITIAL_FORM_DATA, startDate: dateStr });
    setIsModalOpen(true);
  }, []);

  /**
   * Open modal for editing an existing subscription
   */
  const openEditModal = useCallback((sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      startDate: sub.startDate,
      category: sub.category,
      status: sub.status,
    });
    setIsModalOpen(true);
  }, []);

  /**
   * Close all modals and reset state
   */
  const closeModals = useCallback(() => {
    setIsModalOpen(false);
    setEditingSub(null);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  /**
   * Calculate next billing date based on start date and billing cycle
   */
  const calculateNextBillingDate = useCallback((startDate: string, cycle: 'weekly' | 'monthly' | 'yearly'): Date => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      start.setTime(new Date().getTime());
    }
    const now = new Date();
    const next = new Date(start);

    while (next < now) {
      if (cycle === 'weekly') next.setDate(next.getDate() + 7);
      else if (cycle === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
    }
    return next;
  }, []);

  /**
   * Filter and sort subscriptions based on search query and sort criteria
   * Memoized to prevent unnecessary recalculations
   */
  const filteredAndSorted = useMemo(() => {
    let result = subscriptions.filter((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'nextBillingDate') {
        const nextA = calculateNextBillingDate(a.startDate, a.billingCycle);
        const nextB = calculateNextBillingDate(b.startDate, b.billingCycle);
        return nextA.getTime() - nextB.getTime();
      }
      return 0;
    });

    return result;
  }, [subscriptions, searchQuery, sortBy, calculateNextBillingDate]);

  // Calculate aggregate statistics
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'active'), [subscriptions]);

  const monthlyTotal = useMemo(() => activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + (s.amount / 12);
    if (s.billingCycle === 'weekly') return sum + (s.amount * 4.33); // Average weeks in a month
    return sum + s.amount;
  }, 0), [activeSubs]);

  const yearlyTotal = useMemo(() => activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + (s.amount * 12);
    if (s.billingCycle === 'weekly') return sum + (s.amount * 52);
    return sum + s.amount;
  }, 0), [activeSubs]);

  // Pagination calculations
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const displayedSubs = filteredAndSorted.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  /**
   * Get Chip color based on subscription status
   */
  const getStatusColor = useCallback((status: string): 'success' | 'warning' | 'error' => {
    if (status === 'active') return 'success';
    if (status === 'paused') return 'warning';
    return 'error';
  }, []);

  return {
    subscriptions,
    loading,
    error,
    isModalOpen,
    editingSub,
    searchQuery,
    sortBy,
    page,
    pageSize,
    deleteTarget,
    isDeleting,
    formData,
    filteredAndSorted,
    totalPages,
    displayedSubs,
    activeSubs,
    monthlyTotal,
    yearlyTotal,
    setSearchQuery,
    setSortBy,
    setPage,
    setIsModalOpen,
    setFormData,
    setDeleteTarget,
    openAddModal,
    openEditModal,
    closeModals,
    handleSaveSub,
    handleDelete,
    calculateNextBillingDate,
    getStatusColor,
    refetch: fetchSubscriptions,
  };
}
