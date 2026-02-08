'use client';

import React from 'react';
import { FiGrid, FiBarChart2, FiBookOpen, FiSettings, FiLogOut } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Sidebar = () => {
  const handleLogout = () => {
    signOut(auth);
  };

  const menuItems = [
    { icon: FiGrid, name: 'Dashboard', active: true },
    { icon: FiBarChart2, name: 'Analytics', active: false },
    { icon: FiBookOpen, name: 'My Books', active: false },
    { icon: FiSettings, name: 'Settings', active: false },
  ];

  return (
    <div className="w-24 bg-white h-screen p-5 border-r flex flex-col items-center shadow-sm">
      <div className="text-3xl font-bold mb-12 text-indigo-600">P.</div>
      <nav className="flex-grow">
        <ul className="space-y-6">
          {menuItems.map(item => (
            <li key={item.name}>
              <a href="#" className={`flex flex-col items-center text-gray-500 hover:text-indigo-600 transition-colors ${item.active ? 'text-indigo-600' : ''}`}>
                <item.icon className="text-2xl mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button onClick={handleLogout} className="mt-auto p-3 hover:bg-red-100 rounded-full text-red-500 transition-colors">
        <FiLogOut className="text-2xl" />
      </button>
    </div>
  );
};

export default Sidebar;
