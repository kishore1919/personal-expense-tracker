/**
 * Books Firestore service layer.
 * Provides type-safe methods for book CRUD operations.
 */

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import type { Book, BookWithExpenses } from '@/app/types';
import { toDate } from '@/app/lib/firestore';

const BOOKS_COLLECTION = 'books';

/**
 * Convert Firestore document to Book interface.
 */
function docToBook(docSnapshot: { id: string; data: () => DocumentData }): Book {
  const data = docSnapshot.data();
  const createdAtRaw = toDate(data.createdAt);

  return {
    id: docSnapshot.id,
    name: data.name || '',
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : undefined,
    createdAtRaw,
    updatedAtString: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toLocaleDateString()
      : undefined,
    net: data.net ?? data.netBalance ?? 0,
    netBalance: data.netBalance ?? data.net ?? 0,
    userId: data.userId,
    archived: data.archived ?? false,
  };
}

/**
 * Get all books for a user.
 */
export async function getUserBooks(userId: string): Promise<Book[]> {
  const q = query(
    collection(db, BOOKS_COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBook);
}

/**
 * Get a single book by ID.
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docToBook({ id: docSnap.id, data: () => docSnap.data() }) : null;
}

/**
 * Create a new book.
 */
export async function createBook(userId: string, name: string): Promise<string> {
  const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
    name,
    userId,
    createdAt: serverTimestamp(),
    archived: false,
  });
  return docRef.id;
}

/**
 * Update a book.
 */
export async function updateBook(
  bookId: string,
  data: Partial<Pick<Book, 'name' | 'archived'>>
): Promise<void> {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a book.
 */
export async function deleteBook(bookId: string): Promise<void> {
  const expensesRef = collection(db, BOOKS_COLLECTION, bookId, 'expenses');
  const expensesSnap = await getDocs(expensesRef);
  const batch = writeBatch(db);
  expensesSnap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  await deleteDoc(docRef);
}

/**
 * Calculate book balance from expenses subcollection.
 */
export async function calculateBookBalance(bookId: string): Promise<{
  cashIn: number;
  cashOut: number;
  netBalance: number;
}> {
  const expensesRef = collection(db, `books/${bookId}/expenses`);
  const snapshot = await getDocs(expensesRef);

  let cashIn = 0;
  let cashOut = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    if (data.type === 'in') {
      cashIn += amount;
    } else {
      cashOut += amount;
    }
  });

  return { cashIn, cashOut, netBalance: cashIn - cashOut };
}

/**
 * Get books with calculated balances.
 */
export async function getBooksBalances(bookIds: string[]): Promise<Record<string, BookWithExpenses>> {
  const balances = await Promise.all(
    bookIds.map(async (id) => {
      const balance = await calculateBookBalance(id);
      const book = await getBookById(id);
      if (!book) return null;
      return {
        ...book,
        ...balance,
      } as BookWithExpenses;
    })
  );

  return balances.reduce(
    (acc, book) => {
      if (book) {
        acc[book.id] = book;
      }
      return acc;
    },
    {} as Record<string, BookWithExpenses>
  );
}
