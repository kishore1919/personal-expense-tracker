'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
  setCurrency: (nextCurrency: string) => Promise<void>;
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
  const [user] = useAuthState(auth);
  
  const currencyOptions = useMemo<CurrencyOption[]>(() => {
    return getSupportedCurrencyCodes()
      .map((code) => ({ code, label: getCurrencyLabel(code) }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  const supportedCurrencySet = useMemo(
    () => new Set(currencyOptions.map((option) => option.code)),
    [currencyOptions]
  );

  // Initialize to a safe default so server render matches initial client render.
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);

  // On mount, read the persisted preference from localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const normalized = saved ? saved.toUpperCase() : null;
      if (normalized && supportedCurrencySet.has(normalized)) setCurrencyState(normalized);
    } catch {
      // ignore
    }
  }, [supportedCurrencySet]);

  // When user is available, sync with Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const firestoreCurrency = data.currency?.toUpperCase();
        if (firestoreCurrency && supportedCurrencySet.has(firestoreCurrency)) {
          setCurrencyState(firestoreCurrency);
          localStorage.setItem(CURRENCY_STORAGE_KEY, firestoreCurrency);
        }
      }
    });

    return () => unsubscribe();
  }, [user, supportedCurrencySet]);

  const setCurrency = useCallback(
    async (nextCurrency: string) => {
      const normalizedCurrency = nextCurrency.toUpperCase();
      if (!supportedCurrencySet.has(normalizedCurrency)) {
        return;
      }

      setCurrencyState(normalizedCurrency);
      localStorage.setItem(CURRENCY_STORAGE_KEY, normalizedCurrency);

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), { 
            currency: normalizedCurrency,
            updatedAt: new Date()
          }, { merge: true });
        } catch (error) {
          console.error('Error saving currency to Firestore:', error);
        }
      }
    },
    [supportedCurrencySet, user]
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
