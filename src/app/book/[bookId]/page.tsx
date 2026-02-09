'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft } from 'react-icons/fi';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from '../../../app/firebase';
import AddExpenseModal from '../../components/AddExpenseModal';

interface Expense {
  id: string;
  description: string;
  amount: number;
}

const BookDetailPage = () => {
  const router = useRouter();
  const { bookId } = useParams();
  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId) return;

      const bookRef = doc(db, 'books', bookId as string);
      const bookSnap = await getDoc(bookRef);

      if (bookSnap.exists()) {
        setBookName(bookSnap.data().name);
      } else {
        console.log("No such document!");
      }

      const expensesQuery = await getDocs(collection(db, `books/${bookId}/expenses`));
      const expensesData = expensesQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(expensesData);
    };

    fetchBookDetails();
  }, [bookId]);

  const handleAddExpense = async (expense: { description: string; amount: number }) => {
    if (!bookId) return;

    try {
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), expense);
      setExpenses([...expenses, { id: docRef.id, ...expense }]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="text-white">
      <header className="flex items-center mb-10">
        <button onClick={() => router.back()} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors mr-4">
          <FiChevronLeft />
        </button>
        <h1 className="text-4xl font-bold">{bookName}</h1>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <button onClick={() => setIsModalOpen(true)} className="bg-white/90 text-indigo-600 px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg hover:bg-white transition-all">
            <FiPlus className="mr-2 text-xl" /> Add New Expense
          </button>
        </div>

        <div className="glassmorphic rounded-2xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Expenses</h2>
            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-4 glassmorphic rounded-lg">
                    <span className="font-semibold">{expense.description}</span>
                    <span className="font-bold text-red-400">-${expense.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-white/70 text-center py-10">No expenses yet. Add your first one!</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BookDetailPage;
