'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { FiGrid, FiBarChart2, FiBookOpen, FiSettings } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: FiGrid, name: 'Dashboard', path: '/' },
    { icon: FiBarChart2, name: 'Analytics', path: '/analytics' },
    { icon: FiBookOpen, name: 'My Books', path: '/books' },
    { icon: FiSettings, name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-24 glassmorphic h-screen p-4 flex flex-col items-center">
      <div className="bg-white/20 w-12 h-12 flex items-center justify-center rounded-2xl mb-10">
        <FaBook className="text-white text-2xl" />
      </div>
      <nav className="flex-grow">
        <ul className="space-y-4">
          {menuItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <a 
                  href={item.path} 
                  className={`
                    flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-white/30 text-white scale-105 shadow-inner' 
                      : 'text-white/50 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`text-2xl mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-xs font-semibold">{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
