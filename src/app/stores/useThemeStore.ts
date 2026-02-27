/**
 * Theme Store for managing light/dark mode using Zustand.
 *
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - LocalStorage persistence for user choice
 * - CSS class-based theme switching
 *
 * @example
 * // Using in a component
 * const { isDarkMode, toggleDarkMode, setDarkMode } = useThemeStore();
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const THEME_STORAGE_KEY = 'expense-tracker-theme';

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    
    // Fall back to system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    return false;
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: getInitialTheme(),
      
      setDarkMode: (enabled: boolean) => {
        set({ isDarkMode: enabled });
        
        // Apply CSS class to document
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', enabled);
        }
      },
      
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        
        // Apply CSS class to document
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', newMode);
        }
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
      onRehydrateStorage: () => (state) => {
        // Apply theme class when rehydrating from storage
        if (state && typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', state.isDarkMode);
        }
      },
    }
  )
);
