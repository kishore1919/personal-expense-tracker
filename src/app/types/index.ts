import type { Timestamp } from 'firebase/firestore';

export interface Book {
  id: string;
  name: string;
  createdAt?: string;
  createdAtRaw?: Date | null;
  updatedAtString?: string;
  net?: number;
  netBalance?: number;
  userId?: string;
}

export interface BookWithExpenses extends Book {
  cashIn: number;
  cashOut: number;
}

export interface Expense {
  id: string;
  amount: number;
  type: 'in' | 'out';
  description?: string;
  date?: Timestamp | Date;
  category?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type SortOption = 'last-updated' | 'name';

export type PageSize = 10 | 25 | 50;

export interface PaginationState {
  page: number;
  pageSize: PageSize;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}
