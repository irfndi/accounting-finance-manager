import React, { createContext, useContext, useEffect, useState } from 'react';
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

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  const refreshAuth = async () => {
    // Only run auth check on client side
    if (typeof window === 'undefined') {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      return;
    }

    try {
      const currentState = auth.getState();
      
      if (!currentState.isAuthenticated) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
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
      } catch {
        // Token is invalid, clear auth
        auth.logout();
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      auth.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    }
  };

  const login = (token: string, user: User) => {
    auth.login(token, user);
    setAuthState({
      isAuthenticated: true,
      user,
      isLoading: false
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      auth.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  return (
    <AuthGuardContent fallback={fallback}>
      {children}
    </AuthGuardContent>
  );
}

function AuthGuardContent({ children, fallback }: AuthGuardProps) {
  // During SSR, render children to include protected content in initial HTML
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }
  const [isClient, setIsClient] = useState(false);
  const authContext = useContext(AuthContext);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // During SSR or before hydration, show loading state
  if (!isClient) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }
  
  if (!authContext) {
    throw new Error('AuthGuardContent must be used within AuthProvider');
  }

  const { isAuthenticated, isLoading } = authContext;

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    // Use useEffect to handle redirect to avoid issues during render
    React.useEffect(() => {
      window.location.href = '/login';
    }, []);
    
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function useAuth() {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return authContext;
}