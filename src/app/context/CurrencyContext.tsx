'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CURRENCY_STORAGE_KEY = 'expense-tracker-currency';
const DEFAULT_CURRENCY = 'USD';

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

interface CurrencyContextValue {
  currency: string;
  setCurrency: (nextCurrency: string) => void;
  formatCurrency: (amount: number) => string;
  currencyOptions: CurrencyOption[];
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const getSupportedCurrencyCodes = (): string[] => {
  const supportedValuesOf = Intl?.supportedValuesOf as
    | ((key: string) => string[])
    | undefined;

  if (supportedValuesOf) {
    return supportedValuesOf('currency').map((code) => code.toUpperCase());
  }

  return FALLBACK_CURRENCIES;
};

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

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const currencyOptions = useMemo<CurrencyOption[]>(() => {
    return getSupportedCurrencyCodes()
      .map((code) => ({ code, label: getCurrencyLabel(code) }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

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

  const value = useMemo(
    () => ({ currency, setCurrency, formatCurrency, currencyOptions }),
    [currency, setCurrency, formatCurrency, currencyOptions]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
};
