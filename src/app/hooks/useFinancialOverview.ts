/**
 * Custom hook for fetching a consolidated financial overview.
 * Aggregates data from books, loans, investments, and budgets.
 * Optimized to minimize Firestore reads by using batch fetching.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

interface FinancialOverview {
  totalNetWorth: number;
  totalLiability: number;
  totalInvestments: number;
  totalBudget: number;
  totalSpent: number;
  booksCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Calculates net balance from an array of expenses.
 * Positive amounts (type 'in') are added, negative amounts (type 'out') are subtracted.
 */
function calculateNetBalance(expenses: Array<{ amount?: unknown; type?: unknown }>): number {
  return expenses.reduce((total, expense) => {
    const amount = Number(expense.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return expense.type === 'in' ? total + safeAmount : total - safeAmount;
  }, 0);
}

/**
 * Fetches expenses for multiple books in parallel using Promise.all.
 * This is more efficient than fetching each book's expenses sequentially.
 */
async function fetchBooksWithExpenses(bookIds: string[]): Promise<Map<string, number>> {
  const bookNetsMap = new Map<string, number>();

  // Fetch all book expenses in parallel
  const expensePromises = bookIds.map(async (bookId) => {
    try {
      const expensesSnap = await getDocs(collection(db, `books/${bookId}/expenses`));
      const expenses = expensesSnap.docs.map((ed) => ed.data());
      const net = calculateNetBalance(expenses);
      return { bookId, net };
    } catch (error) {
      console.error(`Error fetching expenses for book ${bookId}:`, error);
      return { bookId, net: 0 };
    }
  });

  const results = await Promise.all(expensePromises);
  results.forEach(({ bookId, net }) => bookNetsMap.set(bookId, net));

  return bookNetsMap;
}

export function useFinancialOverview(): FinancialOverview {
  const [user] = useAuthState(auth);
  const [data, setData] = useState({
    totalNetWorth: 0,
    totalLiability: 0,
    totalInvestments: 0,
    totalBudget: 0,
    totalSpent: 0,
    booksCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Books
      const booksQuery = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnapshot = await getDocs(booksQuery);
      const bookIds = booksSnapshot.docs.map((doc) => doc.id);

      // 2. Fetch all book expenses in parallel (fixes N+1 query issue)
      const bookExpensesMap = await fetchBooksWithExpenses(bookIds);
      const totalBooksNet = Array.from(bookExpensesMap.values()).reduce((sum, net) => sum + net, 0);

      // 3. Fetch Loans
      const loansQuery = query(collection(db, 'loans'), where('userId', '==', user.uid));
      const loansSnapshot = await getDocs(loansQuery);
      let totalLiability = 0;

      loansSnapshot.docs.forEach((doc) => {
        const loan = doc.data();
        const principal = Number(loan.amount) || 0;
        const paid = Number(loan.paidAmount) || 0;
        totalLiability += (principal - paid);
      });

      // 4. Fetch Fixed Deposits
      const fdsQuery = query(collection(db, 'fixedDeposits'), where('userId', '==', user.uid));
      const fdsSnapshot = await getDocs(fdsQuery);
      let totalInvestments = 0;
      fdsSnapshot.docs.forEach((doc) => {
        totalInvestments += Number(doc.data().principalAmount) || 0;
      });

      // 5. Fetch Budgets (uses cached book expenses from step 2)
      const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const budgetsSnapshot = await getDocs(budgetsQuery);
      let totalBudget = 0;
      let totalSpent = 0;

      budgetsSnapshot.docs.forEach((budgetDoc) => {
        const budgetData = budgetDoc.data();
        totalBudget += Number(budgetData.amount) || 0;

        const bookId = budgetData.bookId;
        // Use cached expenses instead of re-fetching
        const spent = bookExpensesMap.get(bookId) || 0;
        // Only count expenses (negative net = spent)
        if (spent < 0) {
          totalSpent += Math.abs(spent);
        }
      });

      setData({
        totalNetWorth: totalBooksNet + totalInvestments - totalLiability,
        totalLiability,
        totalInvestments,
        totalBudget,
        totalSpent,
        booksCount: booksSnapshot.docs.length,
      });

    } catch (err) {
      console.error('Error fetching financial overview:', err);
      setError('Failed to load financial overview.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for expense updates from child pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expenses-updated') {
        fetchData();
      }
    };

    const handleCustomEvent = () => {
      fetchData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('expenses-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenses-updated', handleCustomEvent);
    };
  }, [fetchData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
}
