import React, { useEffect, useState } from 'react';
import { auth, authApi, type User } from '../lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentState = auth.getState();
        
        if (!currentState.isAuthenticated) {
          // No token or user data, redirect to login
          window.location.href = '/login';
          return;
        }

        // Verify token is still valid by fetching profile
        try {
          const user = await authApi.getProfile();
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false
          });
        } catch (error) {
          // Token is invalid, clear auth and redirect
          auth.logout();
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        auth.logout();
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  if (authState.isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-slate-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!authState.isAuthenticated) {
    // This shouldn't happen as we redirect above, but just in case
    return null;
  }

  return <>{children}</>;
}

// Hook to use authentication state in components
export function useAuth() {
  const [authState, setAuthState] = useState(() => auth.getState());

  useEffect(() => {
    // Set up a listener for auth state changes
    const checkAuth = () => {
      setAuthState(auth.getState());
    };

    // Check auth state periodically
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      auth.logout();
      window.location.href = '/login';
    }
  };

  return {
    ...authState,
    logout
  };
}