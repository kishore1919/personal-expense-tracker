/**
 * Custom React hooks for the Personal Expense Tracker application.
 * 
 * This module exports all custom hooks from a centralized location,
 * providing a clean API for components to import from.
 * 
 * @module hooks
 * @description
 * Exported hooks:
 * - useBooks: Basic book management with optional net balance calculation
 * - useBooksWithPagination: Advanced book management with pagination, search, and sorting
 * - useAuthRedirect: Core authentication redirect logic
 * - useProtectedRoute: Route protection for authenticated users
 * - usePublicRoute: Route protection for public pages (redirects authenticated users)
 * 
 * @example
 * import { useBooks, useProtectedRoute } from '@/app/hooks';
 */

// Basic book management hook
export { useBooks } from './useBooks';

// Advanced book management with pagination
export { useBooksWithPagination } from './useBooksWithPagination';

// Authentication and route protection hooks
export { 
  useAuthRedirect, 
  useProtectedRoute, 
  usePublicRoute 
} from './useAuth';
