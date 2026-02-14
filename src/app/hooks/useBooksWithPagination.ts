/**
 * Custom hook for managing books with pagination, sorting, and search functionality.
 * Provides comprehensive book management including CRUD operations and filtering.
 * 
 * @interface UseBooksWithPaginationOptions - Configuration options for pagination and filtering
 * @interface UseBooksWithPaginationReturn - Return type with data and helper functions
 */
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

/**
 * Options for configuring the useBooksWithPagination hook
 * @interface UseBooksWithPaginationOptions
 * @property {string} searchQuery - Current search query for filtering books
 * @property {SortOption} sortBy - Sort option ('last-updated' or 'name')
 * @property {number} page - Current page number
 * @property {PageSize} pageSize - Number of items per page
 */
interface UseBooksWithPaginationOptions {
  searchQuery: string;
  sortBy: SortOption;
  page: number;
  pageSize: PageSize;
}

/**
 * Return type for the useBooksWithPagination hook
 * @interface UseBooksWithPaginationReturn
 * @property {Book[]} books - All fetched books
 * @property {Book[]} displayedBooks - Books filtered and sliced for current page
 * @property {boolean} loading - Loading state indicator
 * @property {string | null} error - Error message if any
 * @property {number} totalFiltered - Total number of filtered books
 * @property {number} totalPages - Total number of pages
 * @property {number} startIndex - Start index of current page
 * @property {number} endIndex - End index of current page
 * @property {(name: string) => Promise<void>} addBook - Function to create a new book
 * @property {(target: string | string[]) => Promise<boolean>} deleteBooks - Function to delete books
 * @property {boolean} isDeleting - Deletion in progress indicator
 */
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

/**
 * Extracts creation timestamp in milliseconds from various date formats.
 * Handles Firestore Timestamp, Date objects, and numbers.
 * 
 * @param {unknown} createdAt - The createdAt value to parse
 * @returns {number} Timestamp in milliseconds, or 0 if invalid
 */
function getCreatedAtMillis(createdAt: unknown): number {
  if (!createdAt) return 0;
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  if (typeof createdAt === 'object' && 'toDate' in createdAt) {
    return (createdAt as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

/**
 * Calculates net balance from an array of expenses.
 * Positive amounts (type 'in') are added, negative amounts (type 'out') are subtracted.
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
 * Custom hook for managing books with advanced features:
 * - Pagination for large datasets
 * - Search filtering by book name
 * - Sorting by name or last updated
 * - Batch deletion with expense cleanup
 * - Net balance calculation per book
 * 
 * @param {UseBooksWithPaginationOptions} options - Configuration options
 * @returns {UseBooksWithPaginationReturn} Book data, pagination info, and helper functions
 * 
 * @example
 * const {
 *   displayedBooks,
 *   loading,
 *   totalPages,
 *   addBook,
 *   deleteBooks
 * } = useBooksWithPagination({
 *   searchQuery: '',
 *   sortBy: 'last-updated',
 *   page: 1,
 *   pageSize: 10
 * });
 */
export function useBooksWithPagination(
  options: UseBooksWithPaginationOptions
): UseBooksWithPaginationReturn {
  const { searchQuery, sortBy, page, pageSize } = options;
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetches all books from Firestore for the authenticated user.
   * Calculates net balance for each book by summing expenses.
   * Sorts books by creation date (newest first) initially.
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
        querySnapshot.docs.map(async (bookDoc) => {
          const bookData = bookDoc.data();
          
          const expensesSnapshot = await getDocs(
            collection(db, `books/${bookDoc.id}/expenses`)
          );
          const netBalance = calculateNetBalance(
            expensesSnapshot.docs.map((expenseDoc) => expenseDoc.data())
          );

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
        const dateA = getCreatedAtMillis(a.createdAt);
        const dateB = getCreatedAtMillis(b.createdAt);
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

  // Fetch books on mount and when fetchBooks changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  /**
   * Creates a new book in Firestore and optimistically updates local state.
   * The new book is added at the beginning of the list.
   * 
   * @param {string} bookName - The name of the book to create
   * @throws {Error} If user is not authenticated or creation fails
   */
  const addBook = useCallback(async (bookName: string) => {
    if (!user) return;
    
    try {
      const createdAt = new Date();
      const trimmedName = bookName.trim();
      const docRef = await addDoc(collection(db, 'books'), {
        name: trimmedName,
        createdAt,
        userId: user.uid,
      });
      
      setBooks((prev) => [
        { 
          id: docRef.id, 
          name: trimmedName,
          createdAt: createdAt.toLocaleDateString(),
          createdAtRaw: createdAt,
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

  /**
   * Deletes one or more books from Firestore.
   * Also deletes all associated expenses for each book.
   * Uses batched writes for efficient deletion of many expenses.
   * 
   * @param {string | string[]} target - Single book ID or array of book IDs to delete
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise
   */
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
        // Firestore write batches support up to 500 operations.
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

  /**
   * Filters books by search query and sorts based on the selected option.
   * Uses memoization to avoid recalculating on every render.
   */
  const filteredAndSortedBooks = useMemo(() => {
    let result = books.filter((book) =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'last-updated') {
      result = [...result].sort((a, b) => getCreatedAtMillis(b.createdAt) - getCreatedAtMillis(a.createdAt));
    }

    return result;
  }, [books, searchQuery, sortBy]);

  // Calculate pagination values
  const totalFiltered = filteredAndSortedBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalFiltered);
  
  // Slice books for current page display
  const displayedBooks = filteredAndSortedBooks.slice(
    (page - 1) * pageSize, 
    page * pageSize
  );

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
