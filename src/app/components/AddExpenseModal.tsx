'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: { description: string; amount: number }) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    onAddExpense({ description, amount: parseFloat(amount) });
    setDescription('');
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glassmorphic p-8 rounded-2xl shadow-xl w-full max-w-md z-50 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add New Expense</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-none glassmorphic p-4 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none"
              placeholder="e.g., Groceries, Rent, etc."
            />
          </div>
          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-white/80 mb-2">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-none glassmorphic p-4 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-semibold text-indigo-600 bg-white/90 hover:bg-white transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
