import { createRouter, createRoute, createRootRouteWithContext } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { lazy } from 'react';
import AppShell from './components/AppShell';
import PageLayout from './components/PageLayout';

// Lazy load route components
const FinanceDashboard = lazy(() => import('./components/FinanceDashboard'));
const ChartOfAccounts = lazy(() => import('./components/ChartOfAccounts'));
const FinancialStatements = lazy(() => import('./components/FinancialStatements'));
const DocumentSearch = lazy(() => import('./components/DocumentSearch'));
const ReportsPage = lazy(() => import('./routes/pages/ReportsPage'));
const GeneralLedgerPage = lazy(() => import('./routes/pages/GeneralLedgerPage'));
const PlaceholderPage = lazy(() => import('./routes/pages/PlaceholderPage'));
const BudgetPage = lazy(() => import('./routes/pages/BudgetPage'));

export type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <PageLayout title="Dashboard" description="Financial overview and key performance metrics">
      <FinanceDashboard />
    </PageLayout>
  ),
});

const chartOfAccountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chart-of-accounts',
  component: () => (
    <PageLayout title="Chart of Accounts" description="Define and manage your corporate account structure">
      <ChartOfAccounts />
    </PageLayout>
  ),
});

const generalLedgerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/general-ledger',
  component: () => (
    <PageLayout title="General Ledger" description="Chart of accounts and transaction management">
      <GeneralLedgerPage />
    </PageLayout>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: () => (
    <PageLayout title="Financial Reports" description="Comprehensive financial reporting and analysis">
      <ReportsPage />
    </PageLayout>
  ),
});

const financialStatementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financial-statements',
  component: () => (
    <PageLayout title="Financial Statements" description="Balance sheet, income statement, and cash flow intelligence">
      <FinancialStatements />
    </PageLayout>
  ),
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: () => (
    <PageLayout title="Document Search" description="Semantic document and ledger intelligence">
      <main className="container mx-auto px-4">
        <DocumentSearch />
      </main>
    </PageLayout>
  ),
});

const budgetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/budget',
  component: () => (
    <PageLayout title="Budget & Forecast" description="Plan, compare, and iterate on financial outcomes">
      <BudgetPage />
    </PageLayout>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: () => (
    <PageLayout title="Audit Trail" description="Compliance, approvals, and immutable history">
      <PlaceholderPage title="Audit Trail" description="Audit trail and approvals are under construction for the new stack." />
    </PageLayout>
  ),
});

const entitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/entities',
  component: () => (
    <PageLayout title="Multi-Entity" description="Operate multiple entities with consolidated insight">
      <PlaceholderPage title="Multi-Entity Workspace" description="Entity switcher and consolidations will land shortly." />
    </PageLayout>
  ),
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: () => (
    <PageLayout title="Not found" description="The requested view does not exist">
      <div className="space-y-2">
        <p className="text-lg text-slate-900 font-semibold">Page not found</p>
        <p className="text-slate-600">Use the navigation to jump to a supported module.</p>
      </div>
    </PageLayout>
  ),
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  chartOfAccountsRoute,
  generalLedgerRoute,
  reportsRoute,
  financialStatementsRoute,
  searchRoute,
  budgetRoute,
  auditRoute,
  entitiesRoute,
  notFoundRoute,
]);

export const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
