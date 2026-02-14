/**
 * Sidebar Context for managing collapsible sidebar state.
 * 
 * This context provides sidebar state management with localStorage persistence,
 * allowing users to keep their preferred sidebar state across sessions.
 * 
 * @module SidebarContext
 * @description
 * Features:
 * - Collapsible sidebar with smooth transitions
 * - Responsive width calculation (expanded vs collapsed)
 * - LocalStorage persistence for user preference
 * - Separate mobile navigation using bottom nav
 * 
 * @example
 * // Using the hook in a component
 * const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebar();
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Context value type for SidebarContext
 * @interface SidebarContextType
 * @property {boolean} isCollapsed - Whether sidebar is currently collapsed
 * @property {(collapsed: boolean) => void} setIsCollapsed - Function to set collapsed state
 * @property {number} sidebarWidth - Current width of the sidebar in pixels
 */
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
}

/**
 * Sidebar context for providing sidebar state throughout the app.
 * @constant {React.Context<SidebarContextType | undefined>}
 */
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Width of sidebar when expanded (in pixels)
 * @constant {number}
 */
const DRAWER_WIDTH = 260;

/**
 * Width of sidebar when collapsed (in pixels)
 * @constant {number}
 */
const DRAWER_COLLAPSED_WIDTH = 72;

/**
 * Sidebar Provider component that wraps the application.
 * Manages sidebar state and persists user preferences.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with sidebar context
 * 
 * @example
 * <SidebarProvider>
 *   <App />
 * </SidebarProvider>
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to false but initialize lazily from storage to avoid setState-in-effect.
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'boolean') return parsed;
      }
    } catch {
      // ignore
    }
    return false;
  });

  /**
   * Effect to persist sidebar state to localStorage.
   * Runs whenever isCollapsed value changes.
   */
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  /**
   * Calculates current sidebar width based on collapsed state.
   * Used for adjusting main content margin.
   */
  const sidebarWidth = isCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Custom hook to access sidebar context values.
 * Must be used within a SidebarProvider.
 * 
 * @returns {SidebarContextType} Sidebar context values
 * @throws {Error} If used outside of SidebarProvider
 * 
 * @example
 * function MyComponent() {
 *   const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebar();
 *   
 *   return (
 *     <main style={{ marginLeft: sidebarWidth }}>
 *       <button onClick={() => setIsCollapsed(!isCollapsed)}>
 *         Toggle Sidebar
 *       </button>
 *     </main>
 *   );
 * }
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
