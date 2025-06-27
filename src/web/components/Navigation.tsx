import React, { useState } from 'react';
import { Button } from './ui/button';

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
    id: 'chart-of-accounts',
    label: 'Chart of Accounts',
    href: '/chart-of-accounts',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    description: 'Manage chart of accounts'
  },
  {
    id: 'general-ledger',
    label: 'General Ledger',
    href: '/general-ledger',
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
    id: 'budget-forecast',
    label: 'Budget & Forecast',
    href: '/budget',
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
              <h1 className="text-lg font-semibold">Finance Manager</h1>
              <p className="text-xs text-slate-400">Corporate Accounting</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">CF</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Corporate Finance</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">CF</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}