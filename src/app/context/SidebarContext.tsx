'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;

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

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const sidebarWidth = isCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
