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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glassmorphic p-8 rounded-2xl shadow-xl w-full max-w-md z-50 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Expense Book</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="bookName" className="block text-sm font-medium text-white/80 mb-2">Book Name</label>
            <input
              type="text"
              id="bookName"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="e.g., Groceries, Vacation, etc."
              className="w-full border-none glassmorphic p-4 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none"
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-semibold mr-4 hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-white/90 text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-white transition-all">
              Create Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
