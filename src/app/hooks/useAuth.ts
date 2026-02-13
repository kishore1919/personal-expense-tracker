'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

interface UseAuthRedirectReturn {
  user: ReturnType<typeof useAuthState>[0];
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}): UseAuthRedirectReturn {
  const { redirectTo = '/login', redirectIfAuthenticated = false } = options;
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login';
  const isAuthenticated = !!user;

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isAuthPage) {
      router.push(redirectTo);
    } else if (isAuthenticated && isAuthPage && redirectIfAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, isAuthPage, router, redirectTo, redirectIfAuthenticated]);

  return {
    user,
    loading,
    isAuthenticated,
  };
}

export function useProtectedRoute(): UseAuthRedirectReturn {
  return useAuthRedirect({ redirectTo: '/login' });
}

export function usePublicRoute(): UseAuthRedirectReturn {
  return useAuthRedirect({ 
    redirectTo: '/', 
    redirectIfAuthenticated: true 
  });
}
