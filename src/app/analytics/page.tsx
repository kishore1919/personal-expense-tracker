'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBook } from 'react-icons/fi';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';

interface Book {
  id: string;
  name: string;
  totalExpenses?: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt?: string;
}

const AnalyticsPage = () => {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [averageExpense, setAverageExpense] = useState(0);
  const [highestExpense, setHighestExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const booksSnapshot = await getDocs(collection(db, 'books'));
      const booksData = booksSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      }));
      setTotalBooks(booksData.length);

      let totalAmount = 0;
      let expenseCount = 0;
      let highestAmount = 0;

      for (const book of booksData) {
        const expensesSnapshot = await getDocs(collection(db, `books/${book.id}/expenses`));
        expensesSnapshot.forEach((doc) => {
          const expense = doc.data() as Expense;
          const amount = expense.amount || 0;
          totalAmount += amount;
          expenseCount++;
          if (amount > highestAmount) {
            highestAmount = amount;
          }
        });
      }

      setTotalExpenses(totalAmount);
      setAverageExpense(expenseCount > 0 ? totalAmount / expenseCount : 0);
      setHighestExpense(highestAmount);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Expenses',
      value: `$${totalExpenses.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'bg-red-500/20 text-red-300'
    },
    {
      title: 'Total Books',
      value: totalBooks,
      icon: FiBook,
      color: 'bg-blue-500/20 text-blue-300'
    },
    {
      title: 'Average Expense',
      value: `$${averageExpense.toFixed(2)}`,
      icon: FiTrendingUp,
      color: 'bg-green-500/20 text-green-300'
    },
    {
      title: 'Highest Expense',
      value: `$${highestExpense.toFixed(2)}`,
      icon: FiTrendingDown,
      color: 'bg-orange-500/20 text-orange-300'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="text-white max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-white/70">Track your financial insights and statistics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div key={index} className="glassmorphic p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="text-xl" />
              </div>
            </div>
            <p className="text-white/70 text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glassmorphic p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">Expense Overview</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Spending Activity</span>
                <span className="font-semibold">{totalExpenses > 0 ? 'Active' : 'No Activity'}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: totalExpenses > 0 ? '65%' : '0%' }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Book Organization</span>
                <span className="font-semibold">{totalBooks > 0 ? `${totalBooks} Books` : 'No Books'}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: totalBooks > 0 ? Math.min(totalBooks * 20, 100) + '%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Budget Health</span>
                <span className="font-semibold">{totalExpenses > 0 ? 'Good' : 'N/A'}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glassmorphic p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">Quick Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiTrendingUp className="text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Spending Trend</h3>
                <p className="text-white/70 text-sm">
                  {totalExpenses > 0 
                    ? `You've recorded $${totalExpenses.toFixed(2)} in total expenses across ${totalBooks} book${totalBooks !== 1 ? 's' : ''}.`
                    : 'Start adding expenses to see your spending trends.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiDollarSign className="text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Average Transaction</h3>
                <p className="text-white/70 text-sm">
                  {averageExpense > 0 
                    ? `Your average expense is $${averageExpense.toFixed(2)} per transaction.`
                    : 'Add expenses to calculate your average transaction amount.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiTrendingDown className="text-orange-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Top Expense</h3>
                <p className="text-white/70 text-sm">
                  {highestExpense > 0 
                    ? `Your highest single expense was $${highestExpense.toFixed(2)}.`
                    : 'No expenses recorded yet.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
