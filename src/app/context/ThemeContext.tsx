'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const THEME_STORAGE_KEY = 'expense-tracker-theme';
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [user] = useAuthState(auth);
  // Default to 'light' to ensure server and initial client render match.
  const [theme, setTheme] = useState<Theme>('light');

  // On client mount, read persisted preference (or system preference) and apply it.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme as Theme);
        return;
      }
    } catch {
      // Ignore storage read errors.
    }

    try {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, []);

  // When user is available, sync with Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const firestoreTheme = data.theme;
        if (firestoreTheme === 'dark' || firestoreTheme === 'light') {
          setTheme(firestoreTheme as Theme);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors.
    }
  }, [theme]);

  const updateThemeInFirestore = useCallback(async (newTheme: Theme) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        theme: newTheme,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving theme to Firestore:', error);
    }
  }, [user]);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    const newTheme = enabled ? 'dark' : 'light';
    setTheme(newTheme);
    await updateThemeInFirestore(newTheme);
  }, [updateThemeInFirestore]);

  const toggleDarkMode = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await updateThemeInFirestore(newTheme);
  }, [theme, updateThemeInFirestore]);

  const value = useMemo(
    () => ({
      isDarkMode: theme === 'dark',
      setDarkMode,
      toggleDarkMode,
    }),
    [theme, setDarkMode, toggleDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
