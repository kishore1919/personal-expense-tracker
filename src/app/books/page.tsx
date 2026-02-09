'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';
import AddBookModal from '../components/AddBookModal';
import Loading from '../components/Loading';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
}

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-20 px-10 rounded-2xl glassmorphic">
    <div className="w-24 h-24 bg-white/20 text-white rounded-full mx-auto flex items-center justify-center mb-6">
      <FaBook className="text-4xl" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">No expense books yet!</h2>
    <p className="text-white/70 mb-6 max-w-sm mx-auto">Create your first expense book to start tracking your finances.</p>
    <button onClick={onCreate} className="bg-white/90 text-indigo-600 px-8 py-4 rounded-xl font-semibold flex items-center shadow-lg hover:bg-white transition-all mx-auto">
      <FiPlus className="mr-2 text-xl" /> Create Your First Book
    </button>
  </div>
);

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const booksData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        createdAt: doc.data().createdAt?.toDate?.().toLocaleDateString() || 'Recently'
      }));
      setBooks(booksData);
      setError(null);
    } catch (error) {
      console.error("Error fetching books:", error);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookName: string) => {
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: bookName,
        createdAt: new Date(),
        userId: 'anonymous',
      });
      
      setBooks([{ id: docRef.id, name: bookName, createdAt: 'Just now' }, ...books]);
      setIsModalOpen(false);
      setError(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to create book. Please check your connection and try again.");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await deleteDoc(doc(db, 'books', bookId));
      setBooks(books.filter(book => book.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
      setError("Failed to delete book. Please try again.");
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredBooks = books.filter(book => 
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="text-white max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">My Books</h1>
        <p className="text-white/70">Manage and organize all your expense books.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {books.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Search books..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none glassmorphic p-4 pl-12 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none"
            />
            <FiSearch className="w-5 h-5 absolute left-4 top-4 text-white/50" />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-white/90 text-indigo-600 px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg hover:bg-white transition-all whitespace-nowrap"
          >
            <FiPlus className="mr-2 text-xl" /> Create New Book
          </button>
        </div>
      )}

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div 
              key={book.id} 
              className="glassmorphic p-6 rounded-2xl hover:bg-white/25 transition-all group relative"
            >
              <div 
                onClick={() => handleBookClick(book.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <div className="w-14 h-14 bg-white/20 text-white rounded-xl mr-4 flex items-center justify-center text-2xl">
                    <FaBook />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{book.name}</h3>
                    <p className="text-white/60 text-sm">Created {book.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Click to view details</span>
                  <span className="text-white/50 group-hover:text-white transition-colors">→</span>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id);
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors text-red-300"
                  title="Delete book"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="text-center py-16 glassmorphic rounded-2xl">
          <p className="text-white/70 text-lg">No books match your search.</p>
          <button 
            onClick={() => setSearchQuery('')} 
            className="mt-4 text-white underline hover:text-white/80"
          >
            Clear search
          </button>
        </div>
      ) : (
        <EmptyState onCreate={() => setIsModalOpen(true)} />
      )}

      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddBook={handleAddBook} 
      />
    </div>
  );
};

export default BooksPage;
