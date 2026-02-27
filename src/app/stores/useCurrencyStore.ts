/**
 * Currency Store for managing currency settings and formatting using Zustand.
 *
 * Features:
 * - Support for all ISO 4217 currencies
 * - Automatic currency label generation
 * - LocalStorage persistence for user preference
 * - Number formatting using Intl.NumberFormat
 *
 * @example
 * // Using in a component
 * const { currency, setCurrency, formatCurrency, getCurrencySymbol, currencyOptions } = useCurrencyStore();
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const CURRENCY_STORAGE_KEY = 'expense-tracker-currency';
const DEFAULT_CURRENCY = 'INR';

const FALLBACK_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'SEK',
  'NOK', 'NZD', 'SGD', 'HKD', 'KRW', 'MXN', 'BRL', 'ZAR', 'AED', 'SAR',
  'THB', 'MYR', 'IDR', 'TRY', 'PLN', 'CZK', 'HUF', 'RON', 'DKK', 'ILS',
  'PHP', 'VND', 'PKR', 'EGP', 'NGN', 'KWD', 'QAR', 'BHD', 'CLP', 'COP',
];

export interface CurrencyOption {
  code: string;
  label: string;
}

interface CurrencyState {
  currency: string;
  setCurrency: (nextCurrency: string) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  currencyOptions: CurrencyOption[];
}

/**
 * Gets the list of supported currency codes.
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
 * Generate currency options (memoized outside store since it's static)
 */
const currencyOptions: CurrencyOption[] = getSupportedCurrencyCodes()
  .map((code) => ({ code, label: getCurrencyLabel(code) }))
  .sort((a, b) => a.code.localeCompare(b.code));

const supportedCurrencySet = new Set(currencyOptions.map((option) => option.code));

/**
 * Get initial currency from localStorage or default
 */
function getInitialCurrency(): string {
  try {
    if (typeof window === 'undefined') return DEFAULT_CURRENCY;
    
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    const normalized = saved ? saved.toUpperCase() : null;
    
    return normalized && supportedCurrencySet.has(normalized) 
      ? normalized 
      : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: getInitialCurrency(),
      
      setCurrency: (nextCurrency: string) => {
        const normalizedCurrency = nextCurrency.toUpperCase();
        if (!supportedCurrencySet.has(normalizedCurrency)) {
          return;
        }
        set({ currency: normalizedCurrency });
      },
      
      formatCurrency: (amount: number) => {
        const { currency } = get();
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
      
      getCurrencySymbol: () => {
        const { currency } = get();
        
        try {
          const formatted = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
          }).format(0);

          return formatted.replace(/[\d\s.,]/g, '').trim();
        } catch {
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
      },
      
      currencyOptions,
    }),
    {
      name: CURRENCY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
