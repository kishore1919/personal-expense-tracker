/**
 * Custom hooks for authentication-based route protection.
 * Provides functionality to redirect users based on their authentication status.
 * 
 * @module useAuth
 * @description This module exports three main hooks:
 * - useAuthRedirect: Core hook for authentication-based routing
 * - useProtectedRoute: Hook for protecting routes from unauthenticated users
 * - usePublicRoute: Hook for redirecting authenticated users away from public pages
 */
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

/**
 * Options for configuring the useAuthRedirect hook
 * @interface UseAuthRedirectOptions
 * @property {string} [redirectTo] - Path to redirect to when authentication check fails (default: '/login')
 * @property {boolean} [redirectIfAuthenticated] - Whether to redirect authenticated users away (default: false)
 */
interface UseAuthRedirectOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

/**
 * Return type for authentication redirect hooks
 * @interface UseAuthRedirectReturn
 * @property {ReturnType<typeof useAuthState>[0]} user - Current Firebase user or null
 * @property {boolean} loading - Whether authentication state is still loading
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated
 */
interface UseAuthRedirectReturn {
  user: ReturnType<typeof useAuthState>[0];
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Core authentication redirect hook.
 * Monitors authentication state and redirects users based on configuration.
 * This is the base hook that useProtectedRoute and usePublicRoute build upon.
 * 
 * @param {UseAuthRedirectOptions} options - Configuration options for redirect behavior
 * @returns {UseAuthRedirectReturn} Authentication state and helper values
 * 
 * @example
 * // Redirect to /login if not authenticated
 * const { user, loading, isAuthenticated } = useAuthRedirect();
 * 
 * // Redirect to /dashboard if already authenticated
 * const { user, loading } = useAuthRedirect({
 *   redirectTo: '/dashboard',
 *   redirectIfAuthenticated: true
 * });
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}): UseAuthRedirectReturn {
  const { redirectTo = '/login', redirectIfAuthenticated = false } = options;
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login';
  const isAuthenticated = !!user;

  /**
   * Effect to handle authentication-based redirects.
   * Runs whenever authentication state or pathname changes.
   * - Unauthenticated users on protected pages are redirected to redirectTo
   * - Authenticated users on auth pages are redirected to '/' if redirectIfAuthenticated is true
   */
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

/**
 * Hook for protecting routes from unauthenticated users.
 * Redirects unauthenticated users to the login page.
 * Use this for routes that require authentication to access.
 * 
 * @returns {UseAuthRedirectReturn} Authentication state and helper values
 * 
 * @example
 * function Dashboard() {
 *   const { user, loading, isAuthenticated } = useProtectedRoute();
 *   
 *   if (loading) return <Loading />;
 *   if (!isAuthenticated) return null; // Will redirect to /login
 *   
 *   return <DashboardContent />;
 * }
 */
export function useProtectedRoute(): UseAuthRedirectReturn {
  return useAuthRedirect({ redirectTo: '/login' });
}

/**
 * Hook for public routes that authenticated users should be redirected away from.
 * Redirects authenticated users to the home page.
 * Use this for login, registration, or landing pages.
 * 
 * @returns {UseAuthRedirectReturn} Authentication state and helper values
 * 
 * @example
 * function LoginPage() {
 *   const { user, loading } = usePublicRoute();
 *   
 *   if (loading) return <Loading />;
 *   
 *   return <LoginForm />;
 * }
 */
export function usePublicRoute(): UseAuthRedirectReturn {
  return useAuthRedirect({ 
    redirectTo: '/', 
    redirectIfAuthenticated: true 
  });
}
