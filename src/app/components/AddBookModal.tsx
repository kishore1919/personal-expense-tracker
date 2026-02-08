'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookName: string) => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onAddBook }) => {
  const [bookName, setBookName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookName.trim()) {
      onAddBook(bookName.trim());
      setBookName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md z-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Expense Book</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="bookName" className="block text-sm font-medium text-gray-700 mb-2">Book Name</label>
            <input
              type="text"
              id="bookName"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="e.g., Groceries, Vacation, etc."
              className="w-full border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-gray-600 mr-4 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all">
              Create Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
