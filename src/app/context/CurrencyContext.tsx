/**
 * Currency Context for managing currency settings and formatting.
 *
 * This context provides currency state management with localStorage persistence,
 * supporting multiple world currencies with proper formatting using Intl API.
 *
 * @module CurrencyContext
 * @description
 * Features:
 * - Support for all ISO 4217 currencies
 * - Automatic currency label generation
 * - LocalStorage persistence for user preference
 * - Number formatting using Intl.NumberFormat
 *
 * @example
 * // Using the hook in a component
 * const { currency, formatCurrency, setCurrency } = useCurrency();
 *
 * // Format an amount
 * const formatted = formatCurrency(1234.56); // "₹1,234.56" (if INR)
 */
'use client';

import { useCurrencyStore } from '@/app/stores';

/**
 * LocalStorage key for persisting currency preference
 * @constant {string}
 */
export const CURRENCY_STORAGE_KEY = 'expense-tracker-currency';

/**
 * Default currency code (Indian Rupee)
 * @constant {string}
 */
export const DEFAULT_CURRENCY = 'INR';

/**
 * Currency option for dropdown selection
 * @interface CurrencyOption
 * @property {string} code - ISO 4217 currency code (e.g., 'USD', 'INR')
 * @property {string} label - Display label (e.g., 'USD - US Dollar')
 */
export interface CurrencyOption {
  code: string;
  label: string;
}

/**
 * Context value type for CurrencyContext
 * @interface CurrencyContextValue
 * @property {string} currency - Currently selected currency code
 * @property {(nextCurrency: string) => void} setCurrency - Function to change currency
 * @property {(amount: number) => string} formatCurrency - Function to format amounts
 * @property {CurrencyOption[]} currencyOptions - Available currency options
 */
export interface CurrencyContextValue {
  currency: string;
  setCurrency: (nextCurrency: string) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  currencyOptions: CurrencyOption[];
}

/**
 * Currency Provider component that wraps the application.
 * Manages currency state and persists user preferences.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with currency context
 *
 * @example
 * <CurrencyProvider>
 *   <App />
 * </CurrencyProvider>
 */
export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

/**
 * Custom hook to access currency state using Zustand.
 *
 * @returns {CurrencyContextValue} Currency state values
 *
 * @example
 * function PriceDisplay({ amount }) {
 *   const { currency, formatCurrency } = useCurrency();
 *   return <span>{formatCurrency(amount)}</span>;
 * }
 */
export const useCurrency = (): CurrencyContextValue => {
  const { currency, setCurrency, formatCurrency, getCurrencySymbol, currencyOptions } = useCurrencyStore();
  
  return { currency, setCurrency, formatCurrency, getCurrencySymbol, currencyOptions };
};
