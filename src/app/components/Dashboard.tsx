'use client';

import React from 'react';
import { FiPlus, FiMoreVertical, FiSearch, FiBell } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import Card from './Card';

const Dashboard = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Welcome Back, {user?.email?.split('@')[0] || 'User'}!</h1>
          <p className="text-gray-500 mt-2">Here's your financial snapshot for today.</p>
        </div>
        <div className="flex items-center space-x-6">
          <button className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <FiBell className="text-gray-600" />
          </button>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full mr-4 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Expense Books</h2>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-lg">
              <input 
                type="text" 
                placeholder="Search your books..." 
                className="w-full border-none bg-gray-100 p-4 pl-12 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-700" 
              />
              <FiSearch className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg hover:bg-indigo-700 transition-all ml-4 whitespace-nowrap">
              <FiPlus className="mr-2 text-xl" /> Add New Book
            </button>
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between group border border-gray-100">
                <div className="flex items-center">
                  <div className={`w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl mr-5 flex items-center justify-center text-3xl`}>
                    <FaBook />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">Daily Expenses</div>
                    <div className="text-gray-400 text-sm">Updated 2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-10 text-right">
                    <div className="font-extrabold text-gray-800 text-2xl">$1,250</div>
                    <div className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Balance</div>
                  </div>
                  <button className="p-3 bg-gray-50 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <FiMoreVertical className="text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card>
            <h3 className="font-bold text-xl mb-4 text-gray-800">Quick Actions</h3>
            <div className="space-y-3">
                <button className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center">
                    <FiPlus className="mr-4 text-indigo-500"/> Add New Transaction
                </button>
                 <button className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center">
                    <FaBook className="mr-4 text-purple-500"/> Create New Expense Book
                </button>
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-xl mb-4 text-gray-800">Recent Activity</h3>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4 font-bold">T</div>
                  <div>
                    <p className="font-semibold text-gray-700">+$50.00 from groceries</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

export default Dashboard;
