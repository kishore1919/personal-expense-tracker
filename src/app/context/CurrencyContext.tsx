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

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * LocalStorage key for persisting currency preference
 * @constant {string}
 */
const CURRENCY_STORAGE_KEY = 'expense-tracker-currency';

/**
 * Default currency code (Indian Rupee)
 * @constant {string}
 */
const DEFAULT_CURRENCY = 'INR';

/**
 * Fallback list of supported currencies (used if Intl.supportedValuesOf is unavailable)
 * @constant {string[]}
 */
const FALLBACK_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'SEK',
  'NOK', 'NZD', 'SGD', 'HKD', 'KRW', 'MXN', 'BRL', 'ZAR', 'AED', 'SAR',
  'THB', 'MYR', 'IDR', 'TRY', 'PLN', 'CZK', 'HUF', 'RON', 'DKK', 'ILS',
  'PHP', 'VND', 'PKR', 'EGP', 'NGN', 'KWD', 'QAR', 'BHD', 'CLP', 'COP',
];

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
interface CurrencyContextValue {
  currency: string;
  setCurrency: (nextCurrency: string) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  currencyOptions: CurrencyOption[];
}

/**
 * Currency context for providing currency state throughout the app.
 * @constant {React.Context<CurrencyContextValue | undefined>}
 */
const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

/**
 * Gets the list of supported currency codes.
 * Uses Intl.supportedValuesOf when available, falls back to predefined list.
 * 
 * @returns {string[]} Array of currency codes
 */
const getSupportedCurrencyCodes = (): string[] => {
  const supportedValuesOf = Intl?.supportedValuesOf as
    | ((key: string) => string[])
    | undefined;

  if (supportedValuesOf) {
    return supportedValuesOf('currency').map((code) => code.toUpperCase());
  }

  return FALLBACK_CURRENCIES;
};

/**
 * Gets a display label for a currency code.
 * Uses Intl.DisplayNames API when available.
 * 
 * @param {string} code - ISO 4217 currency code
 * @returns {string} Display label (e.g., 'USD - US Dollar')
 */
const getCurrencyLabel = (code: string): string => {
  if (typeof Intl.DisplayNames !== 'function') {
    return code;
  }

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
    const name = displayNames.of(code);
    return name ? `${code} - ${name}` : code;
  } catch {
    return code;
  }
};

/**
 * Currency Provider component that wraps the application.
 * Manages currency state, generates options, and provides formatting.
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
  /**
   * Memoized list of all available currency options.
   * Generated once and sorted alphabetically by code.
   */
  const currencyOptions = useMemo<CurrencyOption[]>(() => {
    return getSupportedCurrencyCodes()
      .map((code) => ({ code, label: getCurrencyLabel(code) }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  /**
   * Memoized set of supported currency codes for O(1) lookup.
   */
  const supportedCurrencySet = useMemo(
    () => new Set(currencyOptions.map((option) => option.code)),
    [currencyOptions]
  );

  // Initialize to a safe default and read persisted preference lazily to avoid setState-in-effect.
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return DEFAULT_CURRENCY;
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const normalized = saved ? saved.toUpperCase() : null;
      return normalized && supportedCurrencySet.has(normalized) ? normalized : DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  /**
   * Sets a new currency and persists to localStorage.
   * Validates that the currency is supported before setting.
   * 
   * @param {string} nextCurrency - Currency code to set
   */
  const setCurrency = useCallback(
    (nextCurrency: string) => {
      const normalizedCurrency = nextCurrency.toUpperCase();
      if (!supportedCurrencySet.has(normalizedCurrency)) {
        return;
      }

      setCurrencyState(normalizedCurrency);
      localStorage.setItem(CURRENCY_STORAGE_KEY, normalizedCurrency);
    },
    [supportedCurrencySet]
  );

  /**
   * Formats a number as currency using Intl.NumberFormat.
   * Falls back to simple formatting if Intl fails.
   * 
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   * 
   * @example
   * formatCurrency(1234.56); // "₹1,234.56"
   * formatCurrency(0); // "₹0.00"
   */
  const formatCurrency = useCallback(
    (amount: number) => {
      const safeAmount = Number.isFinite(amount) ? amount : 0;

      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(safeAmount);
      } catch {
        return `${currency} ${safeAmount.toFixed(2)}`;
      }
    },
    [currency]
  );

  /**
   * Gets the currency symbol for the current currency.
   * Extracts the symbol from a formatted currency string.
   * 
   * @returns {string} Currency symbol (e.g., '$', '₹', '€')
   * 
   * @example
   * getCurrencySymbol(); // "₹"
   */
  const getCurrencySymbol = useCallback(() => {
    try {
      const formatted = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(0);
      
      // Extract just the symbol by removing numbers and whitespace
      return formatted.replace(/[\d\s.,]/g, '').trim();
    } catch {
      // Fallback to common symbols
      const symbols: Record<string, string> = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
        'INR': '₹', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'SEK': 'kr',
        'NOK': 'kr', 'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩',
        'MXN': '$', 'BRL': 'R$', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': '﷼',
        'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'TRY': '₺', 'PLN': 'zł',
        'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei', 'DKK': 'kr', 'ILS': '₪',
        'PHP': '₱', 'VND': '₫', 'PKR': '₨', 'EGP': 'E£', 'NGN': '₦',
        'KWD': 'د.ك', 'QAR': '﷼', 'BHD': 'د.ب', 'CLP': '$', 'COP': '$',
      };
      return symbols[currency] || currency;
    }
  }, [currency]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ currency, setCurrency, formatCurrency, getCurrencySymbol, currencyOptions }),
    [currency, setCurrency, formatCurrency, getCurrencySymbol, currencyOptions]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

/**
 * Custom hook to access currency context values.
 * Must be used within a CurrencyProvider.
 * 
 * @returns {CurrencyContextValue} Currency context values
 * @throws {Error} If used outside of CurrencyProvider
 * 
 * @example
 * function PriceDisplay({ amount }) {
 *   const { currency, formatCurrency } = useCurrency();
 *   return <span>{formatCurrency(amount)}</span>;
 * }
 */
export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
};
