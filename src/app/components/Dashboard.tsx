'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiMoreVertical, FiSearch } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import Card from './Card';
import AddBookModal from './AddBookModal';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  name: string;
}

const EmptyState = ({ setIsModalOpen }: { setIsModalOpen: (isOpen: boolean) => void }) => (
  <div className="text-center py-20 px-10 rounded-2xl glassmorphic">
    <div className="w-24 h-24 bg-white/20 text-white rounded-full mx-auto flex items-center justify-center mb-6">
      <FaBook className="text-4xl" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">No expense books yet!</h2>
    <p className="text-white/70 mb-6 max-w-sm mx-auto">To get started, create your first expense book. It&apos;s like a digital notebook for your finances.</p>
    <button onClick={() => setIsModalOpen(true)} className="bg-white/90 text-indigo-600 px-8 py-4 rounded-xl font-semibold flex items-center shadow-lg hover:bg-white transition-all mx-auto">
      <FiPlus className="mr-2 text-xl" /> Create Your First Book
    </button>
  </div>
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBooks = async () => {
      const querySnapshot = await getDocs(collection(db, 'books'));
      const booksData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setBooks(booksData);
    };

    fetchBooks();
  }, []);

  const handleAddBook = async (bookName: string) => {
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: bookName,
      });
      setBooks([...books, { id: docRef.id, name: bookName }]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  return (
    <div className="text-white">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Welcome Back!</h1>
          <p className="text-white/70 mt-2">Here&apos;s your financial snapshot for today.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Expense Books</h2>
            {books.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="bg-white/90 text-indigo-600 px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg hover:bg-white transition-all ml-4 whitespace-nowrap">
                <FiPlus className="mr-2 text-xl" /> Add New Book
              </button>
            )}
          </div>
          
          {books.length > 0 && (
            <div className="relative w-full max-w-lg mb-6">
              <input 
                type="text" 
                placeholder="Search your books..." 
                className="w-full border-none glassmorphic p-4 pl-12 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none"
              />
              <FiSearch className="w-5 h-5 absolute left-4 top-4 text-white/50" />
            </div>
          )}

          {books.length > 0 ? (
            <div className="space-y-4">
              {books.map((book) => (
                <div key={book.id} onClick={() => handleBookClick(book.id)} className="glassmorphic p-5 rounded-2xl hover:bg-white/30 transition-all flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center">
                    <div className={`w-16 h-16 bg-white/20 text-white rounded-2xl mr-5 flex items-center justify-center text-3xl`}>
                      <FaBook />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{book.name}</div>
                      <div className="text-white/60 text-sm">Updated just now</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-10 text-right">
                      <div className="font-extrabold text-2xl">$0</div>
                      <div className="text-xs text-white/60 font-semibold tracking-wider uppercase">Balance</div>
                    </div>
                    <button className="p-3 bg-black/10 hover:bg-black/20 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                      <FiMoreVertical className="text-white/80" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState setIsModalOpen={setIsModalOpen} />
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <h3 className="font-bold text-xl mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <button className="w-full text-left p-4 rounded-lg glassmorphic hover:bg-white/30 transition-colors flex items-center">
                    <FiPlus className="mr-4 text-white/80"/> Add New Transaction
                </button>
                 <button onClick={() => setIsModalOpen(true)} className="w-full text-left p-4 rounded-lg glassmorphic hover:bg-white/30 transition-colors flex items-center">
                    <FaBook className="mr-4 text-white/80"/> Create New Expense Book
                </button>
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-xl mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-400/30 text-green-100 rounded-full flex items-center justify-center mr-4 font-bold">T</div>
                <div>
                  <p className="font-semibold">+$50.00 for groceries</p>
                  <p className="text-sm text-white/60">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-400/30 text-red-100 rounded-full flex items-center justify-center mr-4 font-bold">M</div>
                <div>
                  <p className="font-semibold">-$12.99 for movie ticket</p>
                  <p className="text-sm text-white/60">Yesterday</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddBook={handleAddBook} />
    </div>
  );
};

export default Dashboard;
