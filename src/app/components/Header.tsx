'use client';

import React from 'react';
import { FiPlus, FiBell } from 'react-icons/fi';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Header = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="flex justify-between items-center p-5 bg-white border-b">
      <div className="text-xl font-bold">My Personal Finance</div>
      <div className="flex items-center">
        <FiBell className="mr-5 text-gray-600" />
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-100 rounded-full mr-3 flex items-center justify-center text-indigo-600 font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>{user?.email?.split('@')[0] || 'User'}</div>
        </div>
      </div>
    </div>
  );
};

export default Header;
