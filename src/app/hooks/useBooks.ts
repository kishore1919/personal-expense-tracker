/**
 * Custom hook for managing books (expense books) in the application.
 * Provides functionality to fetch, display, and add books for the authenticated user.
 * Optionally calculates net balance for each book when calculateNet option is enabled.
 * 
 * @interface UseBooksOptions - Configuration options for the hook
 * @interface UseBooksReturn - Return type with books data and helper functions
 * 
 * @example
 * const { books, loading, error, addBook } = useBooks({ calculateNet: true });
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import type { Book } from '@/app/types';

/**
 * Options for configuring the useBooks hook
 * @interface UseBooksOptions
 * @property {boolean} [calculateNet] - Whether to calculate net balance for each book
 */
interface UseBooksOptions {
  calculateNet?: boolean;
}

/**
 * Return type for the useBooks hook
 * @interface UseBooksReturn
 * @property {Book[]} books - Array of book objects
 * @property {boolean} loading - Loading state indicator
 * @property {string | null} error - Error message if any
 * @property {() => Promise<void>} refetch - Function to manually refetch books
 * @property {(name: string) => Promise<void>} addBook - Function to create a new book
 */
interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addBook: (name: string) => Promise<void>;
}

/**
 * Calculates the net balance from an array of expenses.
 * Sums income (type 'in') and subtracts expenses (type 'out').
 * 
 * @param {Array<{amount?: unknown, type?: unknown}>} expenses - Array of expense objects
 * @returns {number} Net balance (income - expenses)
 */
function calculateNetBalance(expenses: Array<{ amount?: unknown; type?: unknown }>): number {
  return expenses.reduce((total, expense) => {
    const amount = Number(expense.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return expense.type === 'in' ? total + safeAmount : total - safeAmount;
  }, 0);
}

/**
 * Custom hook for managing books with optional net balance calculation.
 * Fetches books from Firestore for the authenticated user and provides
 * functionality to add new books.
 * 
 * @param {UseBooksOptions} options - Configuration options
 * @returns {UseBooksReturn} Books data and helper functions
 * 
 * @example
 * // Basic usage
 * const { books, loading, error } = useBooks();
 * 
 * // With net balance calculation
 * const { books, loading } = useBooks({ calculateNet: true });
 */
export function useBooks(options: UseBooksOptions = {}): UseBooksReturn {
  const { calculateNet = false } = options;
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches books from Firestore for the authenticated user.
   * Optionally calculates net balance for each book if calculateNet is true.
   * Sorts books by creation date (newest first).
   */
  const fetchBooks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'books'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);

      const booksData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const raw = data.createdAt;
          const createdAtDate = raw?.toDate?.() ?? null;

          let net: number | undefined;
          
          if (calculateNet) {
            const expensesSnap = await getDocs(collection(db, `books/${doc.id}/expenses`));
            net = calculateNetBalance(expensesSnap.docs.map((ed) => ed.data()));
          }

          return {
            id: doc.id,
            name: data.name,
            createdAt: createdAtDate ? createdAtDate.toLocaleDateString() : 'Recently',
            createdAtRaw: createdAtDate,
            net,
          } as Book;
        })
      );

      // Sort by created date (newest first)
      booksData.sort((a, b) => {
        const dateA = a.createdAtRaw?.getTime() || 0;
        const dateB = b.createdAtRaw?.getTime() || 0;
        return dateB - dateA;
      });

      setBooks(booksData);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, calculateNet]);

  /**
   * Creates a new book in Firestore for the authenticated user.
   * Optimistically updates the local state for better UX.
   * 
   * @param {string} name - The name of the book to create
   * @throws {Error} If user is not authenticated or creation fails
   */
  const addBook = useCallback(async (name: string): Promise<void> => {
    if (!user) return;

    try {
      const trimmedName = name.trim();
      const docRef = await addDoc(collection(db, 'books'), {
        name: trimmedName,
        createdAt: new Date(),
        userId: user.uid,
      });

      setBooks((prev) => [
        // Local optimistic entry keeps dashboard responsive right after create.
        { id: docRef.id, name: trimmedName, createdAt: 'Just now', createdAtRaw: new Date(), net: 0 },
        ...prev,
      ]);
    } catch (err) {
      console.error('Error adding book:', err);
      throw new Error('Failed to create book. Please try again.');
    }
  }, [user]);

  // Fetch books on mount and when fetchBooks changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
    addBook,
  };
}
