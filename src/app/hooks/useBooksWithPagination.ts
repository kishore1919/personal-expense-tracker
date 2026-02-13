import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  writeBatch, 
  where 
} from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import type { Book, SortOption, PageSize } from '@/app/types';

interface UseBooksWithPaginationOptions {
  searchQuery: string;
  sortBy: SortOption;
  page: number;
  pageSize: PageSize;
}

interface UseBooksWithPaginationReturn {
  books: Book[];
  displayedBooks: Book[];
  loading: boolean;
  error: string | null;
  totalFiltered: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  addBook: (name: string) => Promise<void>;
  deleteBooks: (target: string | string[]) => Promise<boolean>;
  isDeleting: boolean;
}

export function useBooksWithPagination(
  options: UseBooksWithPaginationOptions
): UseBooksWithPaginationReturn {
  const { searchQuery, sortBy, page, pageSize } = options;
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        querySnapshot.docs.map(async (bookDoc) => {
          const bookData = bookDoc.data();
          
          const expensesSnapshot = await getDocs(
            collection(db, `books/${bookDoc.id}/expenses`)
          );
          
          let netBalance = 0;
          
          expensesSnapshot.docs.forEach((expenseDoc) => {
            const expenseData = expenseDoc.data();
            const amount = expenseData.amount || 0;
            if (expenseData.type === 'in') {
              netBalance += amount;
            } else {
              netBalance -= amount;
            }
          });

          return {
            id: bookDoc.id,
            name: bookData.name,
            createdAt: bookData.createdAt,
            updatedAtString: 'Updated recently',
            netBalance,
          } as Book;
        })
      );

      booksData.sort((a, b) => {
        const getTime = (createdAt: unknown): number => {
          if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
            return (createdAt as { toDate: () => Date }).toDate().getTime();
          }
          return 0;
        };
        
        const dateA = getTime(a.createdAt);
        const dateB = getTime(b.createdAt);
        return dateB - dateA;
      });

      setBooks(booksData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load books.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBook = useCallback(async (bookName: string) => {
    if (!user) return;
    
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: bookName.trim(),
        createdAt: new Date(),
        userId: user.uid,
      });
      
      setBooks((prev) => [
        { 
          id: docRef.id, 
          name: bookName.trim(), 
          updatedAtString: 'Just now', 
          netBalance: 0 
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Error adding document:', err);
      throw new Error('Failed to create book.');
    }
  }, [user]);

  const deleteBooks = useCallback(async (target: string | string[]): Promise<boolean> => {
    const idsToDelete = (Array.isArray(target) ? target : [target]).filter(
      (id): id is string => typeof id === 'string'
    );
    
    if (idsToDelete.length === 0) {
      setError('No valid items selected for deletion.');
      return false;
    }

    setIsDeleting(true);

    try {
      for (const bookId of idsToDelete) {
        const expensesSnap = await getDocs(
          collection(db, 'books', bookId, 'expenses')
        );
        const expenseRefs = expensesSnap.docs.map((d) => d.ref);
        const chunkSize = 499;

        for (let i = 0; i < expenseRefs.length; i += chunkSize) {
          const batch = writeBatch(db);
          const chunk = expenseRefs.slice(i, i + chunkSize);
          chunk.forEach((ref) => batch.delete(ref));
          await batch.commit();
        }

        await deleteDoc(doc(db, 'books', bookId));
      }

      setBooks((prev) => prev.filter((b) => !idsToDelete.includes(b.id)));
      setError(null);
      return true;
    } catch (err) {
      console.error('Error deleting book(s):', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete book(s): ${msg}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const filteredAndSortedBooks = useMemo(() => {
    let result = books.filter((book) =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [books, searchQuery, sortBy]);

  const totalFiltered = filteredAndSortedBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  
  const displayedBooks = filteredAndSortedBooks.slice(
    (page - 1) * pageSize, 
    page * pageSize
  );

  // Clamp page when totalPages changes
  useEffect(() => {
    if (page > totalPages) {
      // This would need to be handled by the caller
    }
  }, [page, totalPages]);

  return {
    books,
    displayedBooks,
    loading,
    error,
    totalFiltered,
    totalPages,
    startIndex,
    endIndex,
    addBook,
    deleteBooks,
    isDeleting,
  };
}
