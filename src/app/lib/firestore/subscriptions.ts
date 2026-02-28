/**
 * Subscriptions Firestore service layer.
 * Provides type-safe methods for subscription CRUD operations.
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import type { Subscription } from '@/app/types';
import { toDate, toNumber } from '@/app/lib/firestore';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

/**
 * Convert Firestore document to Subscription interface.
 */
function docToSubscription(
  docSnapshot: { id: string; data: () => DocumentData }
): Subscription {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    name: data.name || '',
    amount: toNumber(data.amount),
    billingCycle: data.billingCycle || 'monthly',
    startDate: data.startDate || '',
    category: data.category || '',
    status: data.status || 'active',
    userId: data.userId,
    createdAt: toDate(data.createdAt),
  };
}

/**
 * Get all subscriptions for a user.
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToSubscription);
}

/**
 * Create a new subscription.
 */
export async function createSubscription(
  userId: string,
  subscriptionData: Omit<Subscription, 'id' | 'userId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
    ...subscriptionData,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a subscription.
 */
export async function updateSubscription(
  subscriptionId: string,
  data: Partial<Omit<Subscription, 'id' | 'userId'>>
): Promise<void> {
  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await updateDoc(docRef, data);
}

/**
 * Delete a subscription.
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await deleteDoc(docRef);
}

/**
 * Update subscription status.
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: Subscription['status']
): Promise<void> {
  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await updateDoc(docRef, { status });
}

/**
 * Calculate subscription statistics.
 */
export function calculateSubscriptionStats(subscriptions: Subscription[]) {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalSubscriptions = subscriptions.length;
  const activeCount = activeSubs.length;

  // Calculate monthly recurring cost
  const monthlyRecurring = activeSubs.reduce((sum, sub) => {
    let monthlyAmount = sub.amount;
    if (sub.billingCycle === 'weekly') {
      monthlyAmount *= 4.33; // Average weeks per month
    } else if (sub.billingCycle === 'yearly') {
      monthlyAmount /= 12;
    }
    return sum + monthlyAmount;
  }, 0);

  // Calculate yearly cost
  const yearlyRecurring = monthlyRecurring * 12;

  // Group by category
  const byCategory = activeSubs.reduce(
    (acc, sub) => {
      if (!acc[sub.category]) {
        acc[sub.category] = { count: 0, monthlyCost: 0 };
      }
      let monthlyAmount = sub.amount;
      if (sub.billingCycle === 'weekly') {
        monthlyAmount *= 4.33;
      } else if (sub.billingCycle === 'yearly') {
        monthlyAmount /= 12;
      }
      acc[sub.category].count += 1;
      acc[sub.category].monthlyCost += monthlyAmount;
      return acc;
    },
    {} as Record<string, { count: number; monthlyCost: number }>
  );

  return {
    totalSubscriptions,
    activeCount,
    monthlyRecurring,
    yearlyRecurring,
    byCategory,
  };
}

/**
 * Get next billing date for a subscription.
 */
export function getNextBillingDate(subscription: Subscription): Date {
  const start = new Date(subscription.startDate);
  const now = new Date();

  const nextDate = new Date(start);
  while (nextDate < now) {
    switch (subscription.billingCycle) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
  }

  return nextDate;
}
