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

import { useSidebarStore } from '@/app/stores';
import type { ReactNode } from 'react';

/**
 * Context value type for SidebarContext
 * @interface SidebarContextType
 * @property {boolean} isCollapsed - Whether sidebar is currently collapsed
 * @property {(collapsed: boolean) => void} setIsCollapsed - Function to set collapsed state
 * @property {number} sidebarWidth - Current width of the sidebar in pixels
 */
export interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
}

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
  return <>{children}</>;
}

/**
 * Custom hook to access sidebar state using Zustand.
 *
 * @returns {SidebarContextType} Sidebar state values
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
export function useSidebar(): SidebarContextType {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const setIsCollapsed = useSidebarStore((state) => state.setIsCollapsed);
  const sidebarWidth = (isCollapsed ? 72 : 260);
  
  return { isCollapsed, setIsCollapsed, sidebarWidth };
}
