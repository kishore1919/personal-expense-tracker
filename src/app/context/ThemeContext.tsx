/**
 * Theme Context for managing light/dark mode in the application.
 * 
 * This context provides theme state management with system preference detection
 * and localStorage persistence for user preference.
 * 
 * @module ThemeContext
 * @description
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - LocalStorage persistence for user choice
 * - Toggle and set dark mode functions
 * - CSS class-based theme switching for broad compatibility
 * 
 * @example
 * // Using the hook in a component
 * const { isDarkMode, toggleDarkMode } = useTheme();
 * 
 * // In JSX
 * <button onClick={toggleDarkMode}>
 *   {isDarkMode ? 'Light Mode' : 'Dark Mode'}
 * </button>
 */
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * LocalStorage key for persisting theme preference
 * @constant {string}
 */
const THEME_STORAGE_KEY = 'expense-tracker-theme';

/**
 * Theme type definition
 * @typedef {'light' | 'dark'} Theme
 */
type Theme = 'light' | 'dark';

/**
 * Context value type for ThemeContext
 * @interface ThemeContextValue
 * @property {boolean} isDarkMode - Whether dark mode is currently active
 * @property {(enabled: boolean) => void} setDarkMode - Function to set dark mode explicitly
 * @property {() => void} toggleDarkMode - Function to toggle between light and dark
 */
interface ThemeContextValue {
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

/**
 * Theme context for providing theme state throughout the app.
 * @constant {React.Context<ThemeContextValue | undefined>}
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider component that wraps the application.
 * Manages theme state and persists user preferences.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with theme context
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize theme lazily from persisted choice or system preference to avoid setState-in-effect.
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme as Theme;
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  /**
   * Effect to apply theme changes to the DOM.
   * - Toggles 'dark' class on document root
   * - Persists theme choice to localStorage
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors.
    }
  }, [theme]);

  /**
   * Sets dark mode to a specific state.
   * @param {boolean} enabled - Whether to enable dark mode
   */
  const setDarkMode = useCallback((enabled: boolean) => {
    setTheme(enabled ? 'dark' : 'light');
  }, []);

  /**
   * Toggles between light and dark mode.
   */
  const toggleDarkMode = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  // Memoized context value to prevent unnecessary re-renders
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

/**
 * Custom hook to access theme context values.
 * Must be used within a ThemeProvider.
 * 
 * @returns {ThemeContextValue} Theme context values
 * @throws {Error} If used outside of ThemeProvider
 * 
 * @example
 * function MyComponent() {
 *   const { isDarkMode, toggleDarkMode } = useTheme();
 *   return <button onClick={toggleDarkMode}>Toggle Theme</button>;
 * }
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
