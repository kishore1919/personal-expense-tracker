'use client';

import React, { useState } from 'react';
import { FiUser, FiMail, FiMoon, FiBell, FiShield, FiGlobe } from 'react-icons/fi';
import Card from '../components/Card';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const { currency, setCurrency, currencyOptions } = useCurrency();
  const { isDarkMode, toggleDarkMode } = useTheme();

  React.useEffect(() => {
    // Initialize toggles from localStorage after mount to avoid SSR/hydration issues
    try {
      const savedNotifications = localStorage.getItem('pet_notifications');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleNotifications = () => {
    setNotifications((prev) => {
      const next = !prev;
      try { localStorage.setItem('pet_notifications', String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <header className="surface-card p-6 md:p-8">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences.</p>
      </header>

      <div className="space-y-8">
        <Card className="p-7">
          <h2 className="section-title mb-6 flex items-center gap-3">
            <FiUser className="text-teal-700" /> Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 py-3">
              <div className="flex items-center">
                <FiMail className="mr-3 text-slate-400" />
                <span className="text-slate-600">Email</span>
              </div>
              <span className="font-medium text-slate-800">Anonymous</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 py-3">
              <div className="flex items-center">
                <FiShield className="mr-3 text-slate-400" />
                <span className="text-slate-600">Account Status</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Active</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiUser className="mr-3 text-slate-400" />
                <span className="text-slate-600">User ID</span>
              </div>
              <span className="font-medium text-sm text-slate-500">Anonymous</span>
            </div>
          </div>
        </Card>

        <Card className="p-7">
          <h2 className="section-title mb-6 flex items-center gap-3">
            <FiBell className="text-teal-700" /> Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiBell className="mr-3 text-slate-400" />
                <div>
                  <span className="block font-medium text-slate-800">Notifications</span>
                  <span className="text-sm text-slate-500">Receive updates about your expenses</span>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative h-7 w-14 rounded-full transition-colors ${notifications ? 'bg-teal-700' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiMoon className="mr-3 text-slate-400" />
                <div>
                  <span className="block font-medium text-slate-800">Dark Mode</span>
                  <span className="text-sm text-slate-500">Switch between light and dark themes</span>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative h-7 w-14 rounded-full transition-colors ${isDarkMode ? 'bg-teal-700' : 'bg-slate-300'}`}
                aria-label="Toggle dark mode"
                aria-pressed={isDarkMode}
              >
                <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <FiGlobe className="mr-3 text-slate-400" />
                <div>
                  <span className="block font-medium text-slate-800">Currency</span>
                  <span className="text-sm text-slate-500">Used globally across all totals and expenses</span>
                </div>
              </div>
              <div className="w-full md:w-72">
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="text-field"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <div className="pb-4 text-center text-sm text-slate-500">
          <p>Personal Expense Tracker v0.1.0</p>
          <p className="mt-1">Built with Next.js and Firebase</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
