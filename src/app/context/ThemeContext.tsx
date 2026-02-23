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

import { useThemeStore } from '@/app/stores';

/**
 * Context value type for ThemeContext
 * @interface ThemeContextValue
 * @property {boolean} isDarkMode - Whether dark mode is currently active
 * @property {(enabled: boolean) => void} setDarkMode - Function to set dark mode explicitly
 * @property {() => void} toggleDarkMode - Function to toggle between light and dark
 */
export interface ThemeContextValue {
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

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
  return <>{children}</>;
};

/**
 * Custom hook to access theme state using Zustand.
 *
 * @returns {ThemeContextValue} Theme state values
 *
 * @example
 * function MyComponent() {
 *   const { isDarkMode, toggleDarkMode } = useTheme();
 *   return <button onClick={toggleDarkMode}>Toggle Theme</button>;
 * }
 */
export const useTheme = (): ThemeContextValue => {
  const { isDarkMode, setDarkMode, toggleDarkMode } = useThemeStore();
  
  return { isDarkMode, setDarkMode, toggleDarkMode };
};
