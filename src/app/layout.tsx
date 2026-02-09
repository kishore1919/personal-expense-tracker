'use client';

import './globals.css';
import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          {!isAuthPage && <Sidebar />}
          <main className={`flex-1 p-8 ${isAuthPage ? 'flex items-center justify-center' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
