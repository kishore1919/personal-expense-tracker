import './globals.css';
import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
