/**
 * Firestore utility functions for type-safe data handling.
 * Provides helpers for converting Firestore data, handling timestamps, and validation.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Type guard to check if a value is a Firestore Timestamp.
 */
export function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
  return typeof value === 'object' && value !== null && 'toDate' in value;
}

/**
 * Safely convert various date formats to a Date object.
 * Handles Firestore Timestamps, Date objects, and ISO strings.
 *
 * @param value - The value to convert
 * @param fallback - Fallback date if conversion fails (default: new Date(0))
 */
export function toDate(value: unknown, fallback = new Date(0)): Date {
  if (!value) return fallback;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (isFirestoreTimestamp(value)) return value.toDate();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Safely convert a value to a number with fallback.
 *
 * @param value - The value to convert
 * @param fallback - Fallback number if conversion fails (default: 0)
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' || typeof value === 'boolean') {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

/**
 * Safely convert a value to a string with fallback.
 *
 * @param value - The value to convert
 * @param fallback - Fallback string if conversion fails (default: '')
 */
export function toString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Parse Firestore document data with proper type conversion.
 * Handles Timestamps, null values, and missing fields.
 */
export interface ParseFirestoreDocOptions {
  dateFields?: string[];
  numberFields?: string[];
}

export function parseFirestoreDoc<T extends Record<string, unknown>>(
  data: T,
  options: ParseFirestoreDocOptions = {}
): T {
  const { dateFields = [], numberFields = [] } = options;
  const result = { ...data };

  // Convert date fields
  dateFields.forEach((field) => {
    if (field in result) {
      (result as Record<string, unknown>)[field] = toDate(result[field]);
    }
  });

  // Convert number fields
  numberFields.forEach((field) => {
    if (field in result) {
      (result as Record<string, unknown>)[field] = toNumber(result[field]);
    }
  });

  return result;
}

/**
 * Check if a value is a valid Firestore document ID.
 */
export function isValidDocId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 1500;
}
