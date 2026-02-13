import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import type { Book } from '@/app/types';

interface UseBooksOptions {
  calculateNet?: boolean;
}

interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addBook: (name: string) => Promise<void>;
}

export function useBooks(options: UseBooksOptions = {}): UseBooksReturn {
  const { calculateNet = false } = options;
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            let cashIn = 0;
            let cashOut = 0;

            expensesSnap.docs.forEach((ed) => {
              const expenseData = ed.data();
              const amountNum = Number(expenseData.amount);
              const safeAmt = Number.isFinite(amountNum) ? amountNum : 0;
              
              if (expenseData.type === 'in') {
                cashIn += safeAmt;
              } else {
                cashOut += safeAmt;
              }
            });

            net = cashIn - cashOut;
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

  const addBook = useCallback(async (name: string): Promise<void> => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: name.trim(),
        createdAt: new Date(),
        userId: user.uid,
      });

      setBooks((prev) => [
        { id: docRef.id, name: name.trim(), createdAt: 'Just now', createdAtRaw: new Date(), net: calculateNet ? 0 : 0 },
        ...prev,
      ]);
    } catch (err) {
      console.error('Error adding book:', err);
      throw new Error('Failed to create book. Please try again.');
    }
  }, [user, calculateNet]);

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
