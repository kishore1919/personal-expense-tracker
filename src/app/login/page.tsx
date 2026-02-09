'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Link from 'next/link';
import { FaBook } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="glassmorphic p-10 rounded-3xl shadow-2xl w-full max-w-md text-white">
      <div className="text-center mb-8">
        <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-2xl mx-auto mb-4">
          <FaBook className="text-white text-3xl" />
        </div>
        <h2 className="text-3xl font-bold">Welcome Back</h2>
        <p className="text-white/70 mt-2">Log in to manage your expenses</p>
      </div>
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full border-none glassmorphic p-4 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none text-white placeholder-white/50"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full border-none glassmorphic p-4 rounded-xl focus:ring-2 focus:ring-white/50 transition-all outline-none text-white placeholder-white/50"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-300 text-sm text-center bg-red-500/20 p-2 rounded-lg">{error}</p>}

        <div>
          <button
            type="submit"
            className="w-full bg-white/90 text-indigo-600 px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-white transition-all transform hover:scale-[1.02]"
          >
            Log in
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-white/70">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-white hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
