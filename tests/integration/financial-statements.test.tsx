import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FinancialStatements from '../../src/web/components/FinancialStatements';

describe('FinancialStatements', () => {
  it('should display total balance summary', async () => {
    // Mock fetch for financial statements data
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/reports/balance-sheet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            assets: { totalAssets: 45000, currentAssets: [], nonCurrentAssets: [] },
            liabilities: { totalLiabilities: 10000, currentLiabilities: [], nonCurrentLiabilities: [] },
            equity: { totalEquity: 35000, items: [] },
          }),
        }) as any;
      }
      if (url.includes('/api/reports/income-statement')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ totalRevenue: 100000, totalExpenses: 65000, netIncome: 35000, revenue: [], expenses: [] }),
        });
      }
      if (url.includes('/api/reports/cash-flow')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ operating: [], investing: [], financing: [], netCashFlow: 0 }),
        });
      }
      return Promise.resolve({ ok: false, statusText: 'Not Found' });
    });

    render(<FinancialStatements />);

    // Wait for the component to render with data
    const totalAssetsRow = await screen.findByTestId('total-assets-row');
    expect(totalAssetsRow).toHaveTextContent(/total assets/i);
    expect(totalAssetsRow).toHaveTextContent(/\$45,000\.00/);
  });
});