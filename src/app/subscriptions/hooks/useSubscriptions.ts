'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import type { Subscription } from '@/app/types';
import {
  getUserSubscriptions,
  createSubscription as createSubscriptionService,
  updateSubscription as updateSubscriptionService,
  deleteSubscription as deleteSubscriptionService,
  updateSubscriptionStatus as updateSubscriptionStatusService,
  calculateSubscriptionStats,
  getNextBillingDate,
} from '@/app/lib/firestore/subscriptions';

export interface UseSubscriptionsReturn {
  // Data state
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;

  // Filtered and sorted data
  filteredSubscriptions: Subscription[];
  displayedSubscriptions: Subscription[];
  totalPages: number;
  currentPage: number;

  // Statistics
  stats: ReturnType<typeof calculateSubscriptionStats>;

  // Modal state
  isModalOpen: boolean;
  editingSubscription: Subscription | null;
  formData: SubscriptionFormData;

  // Search and sort
  searchQuery: string;
  sortBy: SubscriptionSortOption;

  // Delete state
  deleteTarget: string | null;
  isDeleting: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SubscriptionSortOption) => void;
  setPage: (page: number) => void;
  openAddModal: () => void;
  openEditModal: (subscription: Subscription) => void;
  closeModal: () => void;
  setFormData: (data: SubscriptionFormData) => void;
  saveSubscription: () => Promise<void>;
  deleteSubscription: () => Promise<void>;
  cancelDelete: () => void;
  refreshSubscriptions: () => Promise<void>;
  toggleStatus: (subscriptionId: string, newStatus: Subscription['status']) => Promise<void>;
}

export interface SubscriptionFormData {
  name: string;
  amount: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  category: string;
  status: 'active' | 'paused' | 'cancelled';
}

export type SubscriptionSortOption = 'name' | 'amount' | 'nextBillingDate';

const DEFAULT_FORM_DATA: SubscriptionFormData = {
  name: '',
  amount: '',
  billingCycle: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
  category: 'OTT',
  status: 'active',
};

const PAGE_SIZE = 10;

/**
 * Custom hook for managing subscriptions data and operations.
 * Handles fetching, CRUD operations, filtering, sorting, and pagination.
 */
export function useSubscriptions(user: User | null): UseSubscriptionsReturn {
  // Data state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [formData, setFormDataState] = useState<SubscriptionFormData>(DEFAULT_FORM_DATA);

  // Search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SubscriptionSortOption>('nextBillingDate');

  // Pagination
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  // Fetch subscriptions from Firestore
  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSubscriptions = await getUserSubscriptions(user.uid);
      setSubscriptions(userSubscriptions);
      setError(null);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions.filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'nextBillingDate') {
        const nextA = getNextBillingDate(a);
        const nextB = getNextBillingDate(b);
        return nextA.getTime() - nextB.getTime();
      }
      return 0;
    });

    return result;
  }, [subscriptions, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / PAGE_SIZE));
  const displayedSubscriptions = filteredSubscriptions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Reset page if it exceeds total pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  // Calculate statistics
  const stats = useMemo(() => calculateSubscriptionStats(subscriptions), [subscriptions]);

  // Actions
  const openAddModal = useCallback(() => {
    setEditingSubscription(null);
    setFormDataState(DEFAULT_FORM_DATA);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormDataState({
      name: subscription.name,
      amount: subscription.amount.toString(),
      billingCycle: subscription.billingCycle,
      startDate: subscription.startDate,
      category: subscription.category,
      status: subscription.status,
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSubscription(null);
    setFormDataState(DEFAULT_FORM_DATA);
  }, []);

  const setFormData = useCallback((data: SubscriptionFormData) => {
    setFormDataState(data);
  }, []);

  const saveSubscription = useCallback(async () => {
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
      };

      if (editingSubscription) {
        await updateSubscriptionService(editingSubscription.id, subData);
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === editingSubscription.id ? { ...s, ...subData, id: editingSubscription.id } : s
          )
        );
      } else {
        const newId = await createSubscriptionService(user.uid, subData);
        setSubscriptions((prev) => [{ ...subData, id: newId }, ...prev]);
      }

      closeModal();
      setError(null);
    } catch (err) {
      console.error('Error saving subscription:', err);
      setError('Failed to save subscription. Please try again.');
    }
  }, [user, formData, editingSubscription, closeModal]);

  const deleteSubscription = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteSubscriptionService(deleteTarget);
      setSubscriptions((prev) => prev.filter((s) => s.id !== deleteTarget));
      setError(null);
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError('Failed to delete subscription. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    await fetchSubscriptions();
  }, [fetchSubscriptions]);

  const toggleStatus = useCallback(
    async (subscriptionId: string, newStatus: Subscription['status']) => {
      try {
        await updateSubscriptionStatusService(subscriptionId, newStatus);
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === subscriptionId ? { ...s, status: newStatus } : s))
        );
      } catch (err) {
        console.error('Error updating subscription status:', err);
        setError('Failed to update status. Please try again.');
      }
    },
    []
  );

  return {
    // Data state
    subscriptions,
    loading,
    error,

    // Filtered and sorted data
    filteredSubscriptions,
    displayedSubscriptions,
    totalPages,
    currentPage: page,

    // Statistics
    stats,

    // Modal state
    isModalOpen,
    editingSubscription,
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
    saveSubscription,
    deleteSubscription,
    cancelDelete,
    refreshSubscriptions,
    toggleStatus,
  };
}
