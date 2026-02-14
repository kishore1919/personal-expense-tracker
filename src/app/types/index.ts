/**
 * TypeScript type definitions for the Personal Expense Tracker application.
 * 
 * This module exports all shared TypeScript interfaces and types used across
 * the application for books, expenses, users, and pagination.
 * 
 * @module types
 * @version 1.0.0
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Represents an expense book (a collection of expenses).
 * Books are user-created containers for organizing expenses by category, project, or time period.
 * 
 * @interface Book
 * @property {string} id - Unique Firestore document ID
 * @property {string} name - Display name of the book
 * @property {string} [createdAt] - Human-readable creation date string
 * @property {Date | null} [createdAtRaw] - Raw Date object for sorting
 * @property {string} [updatedAtString] - Human-readable last updated string
 * @property {number} [net] - Net balance (income - expenses) - alternative naming
 * @property {number} [netBalance] - Net balance (income - expenses) - primary naming
 * @property {string} [userId] - Owner user ID (for Firestore queries)
 */
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

/**
 * Extended book interface with calculated cash flow values.
 * Used for detailed analytics and reporting views.
 * 
 * @interface BookWithExpenses
 * @extends Book
 * @property {number} cashIn - Total income/credits
 * @property {number} cashOut - Total expenses/debits
 */
export interface BookWithExpenses extends Book {
  cashIn: number;
  cashOut: number;
}

/**
 * Represents a single expense or income entry within a book.
 * 
 * @interface Expense
 * @property {string} id - Unique Firestore document ID
 * @property {number} amount - Numeric amount (positive value)
 * @property {'in' | 'out'} type - Entry type: 'in' for income, 'out' for expense
 * @property {string} [description] - Brief description of the entry
 * @property {Timestamp | Date} [date] - Date of the entry
 * @property {string} [category] - Category classification (e.g., 'Food', 'Travel')
 */
export interface Expense {
  id: string;
  amount: number;
  type: 'in' | 'out';
  description?: string;
  date?: Timestamp | Date;
  category?: string;
}

/**
 * Firebase Auth user representation.
 * 
 * @interface User
 * @property {string} uid - Unique user identifier from Firebase Auth
 * @property {string | null} email - User's email address
 * @property {string | null} displayName - User's display name
 * @property {string | null} photoURL - URL to user's profile photo
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Available sort options for book lists.
 * 
 * @typedef {'last-updated' | 'name'} SortOption
 * @description
 * - 'last-updated': Sort by most recently updated first
 * - 'name': Sort alphabetically by book name
 */
export type SortOption = 'last-updated' | 'name';

/**
 * Available pagination page sizes.
 * Controls how many items are displayed per page in lists.
 * 
 * @typedef {10 | 25 | 50} PageSize
 * @description Number of items to display per page: 10, 25, or 50
 */
export type PageSize = 10 | 25 | 50;

/**
 * Pagination state for list components.
 * 
 * @interface PaginationState
 * @property {number} page - Current page number (1-indexed)
 * @property {PageSize} pageSize - Number of items per page
 * @property {number} totalPages - Total number of available pages
 * @property {number} startIndex - Index of first item on current page
 * @property {number} endIndex - Index of last item on current page
 */
export interface PaginationState {
  page: number;
  pageSize: PageSize;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}
