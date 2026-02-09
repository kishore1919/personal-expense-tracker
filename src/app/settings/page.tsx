'use client';

import React, { useState } from 'react';
import { FiUser, FiMail, FiMoon, FiBell, FiShield } from 'react-icons/fi';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);



  return (
    <div className="text-white max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-white/70">Manage your account and preferences.</p>
      </header>

      <div className="space-y-8">
        <section className="glassmorphic p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FiUser className="mr-3" /> Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center">
                <FiMail className="text-white/50 mr-3" />
                <span className="text-white/70">Email</span>
              </div>
              <span className="font-medium">Anonymous</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center">
                <FiShield className="text-white/50 mr-3" />
                <span className="text-white/70">Account Status</span>
              </div>
              <span className="font-medium text-green-400">Active</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiUser className="text-white/50 mr-3" />
                <span className="text-white/70">User ID</span>
              </div>
              <span className="font-medium text-sm text-white/50">Anonymous</span>
            </div>
          </div>
        </section>

        <section className="glassmorphic p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FiBell className="mr-3" /> Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiBell className="text-white/50 mr-3" />
                <div>
                  <span className="block font-medium">Notifications</span>
                  <span className="text-sm text-white/50">Receive updates about your expenses</span>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-14 h-7 rounded-full transition-colors relative ${notifications ? 'bg-indigo-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${notifications ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <FiMoon className="text-white/50 mr-3" />
                <div>
                  <span className="block font-medium">Dark Mode</span>
                  <span className="text-sm text-white/50">Currently always enabled</span>
                </div>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        <div className="text-center text-white/50 text-sm pb-8">
          <p>Personal Expense Tracker v0.1.0</p>
          <p className="mt-1">Built with Next.js and Firebase</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
