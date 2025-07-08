import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAuth } from './AuthGuard';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
    description: 'Overview and key metrics'
  },
  {
    id: 'accounts',
    label: 'Accounts',
    href: '/accounts',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    description: 'Manage accounts'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    href: '/transactions',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    description: 'Transactions and journal entries'
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    href: '/reports',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: 'P&L, Balance Sheet, Cash Flow'
  },
  {
    id: 'budgets',
    label: 'Budgets',
    href: '/budgets',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    description: 'Planning and forecasting tools'
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    href: '/audit',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    description: 'Compliance and audit logs'
  },
  {
    id: 'document-search',
    label: 'Document Search',
    href: '/search',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    description: 'Semantic document search'
  },
  {
    id: 'multi-entity',
    label: 'Multi-Entity',
    href: '/entities',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    description: 'Manage multiple companies'
  }
];

interface NavigationProps {
  currentPath?: string;
}

export default function Navigation({ currentPath = '/' }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className={`bg-slate-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen fixed left-0 top-0 z-40`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 data-testid="nav-title" className="text-lg font-semibold">Finance Manager</h1>
              <p className="text-xs text-slate-400">Corporate Accounting</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 hover:text-white hover:bg-slate-800"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <title>{isCollapsed ? 'Expand navigation' : 'Collapse navigation'}</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-2">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center p-3 rounded-lg mb-1 transition-colors group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label={item.label}
              >
                <title>{item.label}</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              
              {!isCollapsed && (
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  )}
                </div>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </a>
          );
        })}
      </div>

      {/* User Section */}
      <UserSection isCollapsed={isCollapsed} />
    </nav>
  );
}

// User section component with authentication
function UserSection({ isCollapsed }: { isCollapsed: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Only render on client side to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Safely get auth context
  let authContext;
  try {
    authContext = useAuth();
  } catch {
    // If useAuth fails, it means we're not within AuthProvider
    if (isClient) {
      console.warn('UserSection rendered outside AuthProvider context');
    }
    return null;
  }
  
  const { user, logout } = authContext;
  
  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="animate-pulse">
          {!isCollapsed ? (
            <div className="flex items-center p-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-slate-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-slate-700 rounded w-32"></div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    // Redirect to login page after logout
    window.location.href = '/login';
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
      {!isCollapsed ? (
        <div className="relative">
          <button
            data-testid="user-menu"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center w-full text-left hover:bg-slate-800 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{userInitials}</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium truncate">{user?.email || 'User'}</p>
              <p className="text-xs text-slate-400">Click to manage account</p>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-600">
              <div className="p-2">
                <button
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center relative">
          <button
            data-testid="user-menu"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <span className="text-sm font-medium">{userInitials}</span>
          </button>
          
          {showDropdown && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-600 whitespace-nowrap">
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-600">
                  {user?.email || 'User'}
                </div>
                <button
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors mt-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}