/**
 * Custom hook for fetching a consolidated financial overview.
 * Aggregates data from books, loans, investments, and budgets.
 * Optimized to minimize Firestore reads by caching book expenses.
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
      const bookIds = booksSnapshot.docs.map(doc => doc.id);
      
      // Cache for book expenses to avoid redundant fetches
      const bookExpensesMap = new Map<string, Array<{ amount: number, type: string }>>();
      
      // Fetch expenses for each book
      const bookNets = await Promise.all(
        bookIds.map(async (id) => {
          const expensesSnap = await getDocs(collection(db, `books/${id}/expenses`));
          const expenses = expensesSnap.docs.map(ed => {
            const edData = ed.data();
            return {
              amount: Number(edData.amount) || 0,
              type: (edData.type as string) || 'out'
            };
          });
          bookExpensesMap.set(id, expenses);
          
          return expenses.reduce((acc, exp) => {
            return exp.type === 'in' ? acc + exp.amount : acc - exp.amount;
          }, 0);
        })
      );
      const totalBooksNet = bookNets.reduce((sum, net) => sum + net, 0);

      // 2. Fetch Loans
      const loansQuery = query(collection(db, 'loans'), where('userId', '==', user.uid));
      const loansSnapshot = await getDocs(loansQuery);
      let totalLiability = 0;
      
      loansSnapshot.docs.forEach((doc) => {
        const loan = doc.data();
        const principal = Number(loan.amount) || 0;
        const paid = Number(loan.paidAmount) || 0;
        totalLiability += (principal - paid);
      });

      // 3. Fetch Fixed Deposits
      const fdsQuery = query(collection(db, 'fixedDeposits'), where('userId', '==', user.uid));
      const fdsSnapshot = await getDocs(fdsQuery);
      let totalInvestments = 0;
      fdsSnapshot.docs.forEach((doc) => {
        totalInvestments += Number(doc.data().principalAmount) || 0;
      });

      // 4. Fetch Budgets
      const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const budgetsSnapshot = await getDocs(budgetsQuery);
      let totalBudget = 0;
      let totalSpent = 0;

      budgetsSnapshot.docs.forEach((budgetDoc) => {
        const budgetData = budgetDoc.data();
        totalBudget += Number(budgetData.amount) || 0;
        
        const bookId = budgetData.bookId;
        const expenses = bookExpensesMap.get(bookId) || [];
        
        // Sum expenses for this book (already fetched above)
        const spent = expenses.reduce((acc, exp) => {
          return exp.type === 'out' ? acc + exp.amount : acc;
        }, 0);
        totalSpent += spent;
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

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
}
