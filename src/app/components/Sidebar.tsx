import React from 'react';
import { FiHome, FiTrendingUp, FiCreditCard, FiSettings, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { FaBook, FaWallet, FaFileInvoice } from 'react-icons/fa';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Sidebar = () => {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="w-64 bg-white h-screen p-5 border-r flex flex-col">
      <div className="text-2xl font-bold mb-10 text-indigo-600">Personal CashBook</div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-5"><a href="#" className="flex items-center text-gray-700 hover:text-indigo-600"><FiHome className="mr-3" /> Dashboard</a></li>
          <li className="mb-5"><a href="#" className="flex items-center text-gray-700 hover:text-indigo-600"><FaWallet className="mr-3" /> My Wallets</a></li>
          <li className="mb-5"><a href="#" className="flex items-center text-gray-700 hover:text-indigo-600"><FaFileInvoice className="mr-3" /> All Transactions</a></li>
          <li className="mb-5"><a href="#" className="flex items-center text-indigo-600 font-bold"><FaBook className="mr-3" /> My Cashbooks</a></li>
          <li className="mb-5"><a href="#" className="flex items-center text-gray-700 hover:text-indigo-600"><FiSettings className="mr-3" /> Settings</a></li>
          <li className="mb-5"><a href="#" className="flex items-center text-gray-700 hover:text-indigo-600"><FiHelpCircle className="mr-3" /> Help & Support</a></li>
        </ul>
      </nav>
      <button onClick={handleLogout} className="mt-auto flex items-center text-red-500 hover:text-red-700">
        <FiLogOut className="mr-3" /> Logout
      </button>
    </div>
  );
};

export default Sidebar;
