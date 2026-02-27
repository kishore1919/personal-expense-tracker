/**
 * Sidebar Store for managing collapsible sidebar state using Zustand.
 *
 * Features:
 * - LocalStorage persistence for user preference
 * - Computed sidebar width based on collapsed state
 *
 * @example
 * // Using in a component
 * const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebarStore();
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const SIDEBAR_STORAGE_KEY = 'sidebar_collapsed';
const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface SidebarComputed {
  sidebarWidth: number;
}

/**
 * Get initial collapsed state from localStorage (SSR-safe)
 */
function getInitialCollapsedState(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'boolean') return parsed;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Calculate sidebar width based on collapsed state
 */
function getSidebarWidth(isCollapsed: boolean): number {
  return isCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: getInitialCollapsedState(),
      
      setIsCollapsed: (collapsed: boolean) => {
        set({ isCollapsed: collapsed });
      },
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook to get sidebar state and actions with computed values
 */
export function useSidebar(): SidebarState & SidebarComputed {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const setIsCollapsed = useSidebarStore((state) => state.setIsCollapsed);
  
  return {
    isCollapsed,
    setIsCollapsed,
    sidebarWidth: getSidebarWidth(isCollapsed),
  };
}

/**
 * Selector hook for getting sidebar width (updates when collapsed state changes)
 */
export const useSidebarWidth = () => 
  useSidebarStore((state) => getSidebarWidth(state.isCollapsed));
