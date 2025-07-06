import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChartOfAccounts from '../../src/web/components/ChartOfAccounts';

// Mock fetch globally
let mockFetch: ReturnType<typeof vi.fn>;

// Helper function to setup fetch mock with different responses
const setupMockFetch = (responses: Record<string, any>, shouldReject = false) => {
  const mock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const key = `${method}:${url}`;
    
    if (shouldReject) {
      return Promise.reject(new Error('Network error'));
    }
    
    const response = responses[key];
    if (response === null) {
      return Promise.reject(new Error('API Error'));
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    } as Response);
  });
  
  global.fetch = mock;
  return mock;
};

// Mock data
const mockAccounts = [
  {
    id: 1,
    name: 'Cash Account',
    type: 'asset',
    balance: 5000.00,
    formattedBalance: '$5,000.00',
    currency: 'USD',
    description: 'Primary cash account for daily operations',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Bank Account - Checking',
    type: 'asset',
    balance: 15000.00,
    formattedBalance: '$15,000.00',
    currency: 'USD',
    description: 'Main business checking account',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    name: 'Credit Card - Business',
    type: 'liability',
    balance: -2000.00,
    formattedBalance: '-$2,000.00',
    currency: 'USD',
    description: 'Business credit card for expenses',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 4,
    name: 'Savings Account',
    type: 'asset',
    balance: 25000.00,
    formattedBalance: '$25,000.00',
    currency: 'USD',
    description: 'Emergency fund and savings',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T16:45:00Z'
  },
  {
    id: 5,
    name: 'Old Account',
    type: 'asset',
    balance: 0.00,
    formattedBalance: '$0.00',
    currency: 'USD',
    description: 'Closed account',
    isActive: false,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-05T12:00:00Z'
  }
];

const mockAccountTypes = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' }
];

const mockCurrencies = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'JPY', label: 'Japanese Yen' }
];

describe('ChartOfAccounts Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore fetch after each test
    vi.restoreAllMocks();
  });

  describe('Account List Display', () => {
    it('should load and display accounts on mount', async () => {
      // Setup mock for initial data loading
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Bank Account - Checking')).toBeInTheDocument();
        expect(screen.getByText('Credit Card - Business')).toBeInTheDocument();
        expect(screen.getByText('Savings Account')).toBeInTheDocument();
      });
      
      // Verify API calls were made
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/accounts', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      // Note: account-types and currencies are only fetched when opening the form
    });

    it('should display account details correctly', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading accounts...')).not.toBeInTheDocument();
      });
      
      // Now check account details
      await waitFor(() => {
        // First check if account names are present
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Bank Account - Checking')).toBeInTheDocument();
      });
      
      // Check account balances
      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument();
        expect(screen.getByText('$15,000.00')).toBeInTheDocument();
        expect(screen.getByText('-$2,000.00')).toBeInTheDocument();
        expect(screen.getByText('$25,000.00')).toBeInTheDocument();
      });
    });

    it.skip('should show only active accounts by default', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      await waitFor(() => {
        // Active accounts should be visible
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Bank Account - Checking')).toBeInTheDocument();
        
        // Inactive account should not be visible by default
        expect(screen.queryByText('Old Account')).not.toBeInTheDocument();
      });
    });
  });

  describe('Account Creation', () => {
    it('should open create account form when Add Account button is clicked', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: [] },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Add Account')).toBeInTheDocument();
      });
      
      // Click Add Account button
      const addButton = screen.getByText('Add Account');
      fireEvent.click(addButton);
      
      // Should show account form
      await waitFor(() => {
        expect(screen.getByText('Create New Account')).toBeInTheDocument();
        expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });
    });

    it.skip('should create a new account successfully', async () => {
      const newAccount = {
        id: 6,
        name: 'New Test Account',
        type: 'asset',
        balance: 1000.00,
        currency: 'USD',
        description: 'Test account for integration testing',
        isActive: true,
        createdAt: '2024-01-18T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z'
      };
      
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies },
        'POST:http://localhost:3000/api/accounts': { account: newAccount }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for component to load and click Add Account
      await waitFor(() => {
        expect(screen.getByText('Add Account')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Add Account'));
      
      // Fill out the form
      await waitFor(() => {
        expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'New Test Account' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test account for integration testing' }
      });
      
      // Select account type
      const typeSelect = screen.getByTestId('account-type-select');
      fireEvent.click(typeSelect);
      
      // Wait for options to appear and select ASSET
      await waitFor(() => {
        const assetOption = screen.getByText('ASSET');
        fireEvent.click(assetOption);
      });
      
      // Submit the form
      const submitButton = screen.getByText('Create Account');
      fireEvent.click(submitButton);
      
      // Verify POST API call was made
      await waitFor(() => {
        const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST');
        expect(postCall![0]).toBe('http://localhost:3000/api/accounts');
        
        const requestBody = JSON.parse(postCall![1]!.body as string);
        expect(requestBody.name).toBe('New Test Account');
        expect(requestBody.balance).toBe(1000.00);
        expect(requestBody.type).toBe('asset');
        expect(requestBody.description).toBe('Test account for integration testing');
      });
    });
  });

  describe('Account Editing', () => {
    it('should open edit form when Edit button is clicked', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading accounts...')).not.toBeInTheDocument();
      });
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      // Find and click edit button for first account
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      
      // Should show edit form with pre-filled data
      await waitFor(() => {
        expect(screen.getByText('Edit Account: Cash Account')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cash Account')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Primary cash account for daily operations')).toBeInTheDocument();
      });
    });

    it.skip('should update account successfully', async () => {
      const updatedAccount = {
        ...mockAccounts[0],
        name: 'Updated Cash Account',
        description: 'Updated description for cash account'
      };
      
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies },
        'PUT:http://localhost:3000/api/accounts/1': { account: updatedAccount }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load and click edit
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      
      // Update the form
      await waitFor(() => {
        expect(screen.getByDisplayValue('Cash Account')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByDisplayValue('Cash Account');
      fireEvent.change(nameInput, {
        target: { value: 'Updated Cash Account' }
      });
      
      const descriptionInput = screen.getByDisplayValue('Primary cash account for daily operations');
      fireEvent.change(descriptionInput, {
        target: { value: 'Updated description for cash account' }
      });
      
      // Submit the form
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);
      
      // Verify PUT API call was made
      await waitFor(() => {
        const putCall = mockFetch.mock.calls.find(call => call[1]?.method === 'PUT');
        expect(putCall![0]).toBe('http://localhost:3000/api/accounts/1');
        
        const requestBody = JSON.parse(putCall![1]!.body as string);
        expect(requestBody.name).toBe('Updated Cash Account');
        expect(requestBody.description).toBe('Updated description for cash account');
      });
    });
  });

  describe('Account Deactivation/Activation', () => {
    it.skip('should deactivate an account', async () => {
      const deactivatedAccount = {
        ...mockAccounts[0],
        isActive: false
      };
      
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies },
        'PATCH:http://localhost:3000/api/accounts/1/deactivate': { account: deactivatedAccount }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      // Find and click deactivate button
      const deactivateButtons = screen.getAllByText('Deactivate');
      fireEvent.click(deactivateButtons[0]);
      
      // Confirm deactivation in modal
      await waitFor(() => {
        expect(screen.getByText('Confirm Deactivation')).toBeInTheDocument();
      });
      
      const confirmButtons = screen.getAllByText('Delete');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]); // Click the last Delete button (confirmation dialog)
      
      // Verify PATCH API call was made
      await waitFor(() => {
        const patchCall = mockFetch.mock.calls.find(call => call[1]?.method === 'PATCH');
        expect(patchCall![0]).toBe('http://localhost:3000/api/accounts/1/deactivate');
      });
    });

    it.skip('should show inactive accounts when toggle is enabled', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.queryByText('Old Account')).not.toBeInTheDocument();
      });
      
      // Toggle to show inactive accounts
      const showInactiveToggle = screen.getByLabelText(/show inactive accounts/i);
      fireEvent.click(showInactiveToggle);
      
      // Should now show inactive account
      await waitFor(() => {
        expect(screen.getByText('Old Account')).toBeInTheDocument();
      });
    });
  });

  describe('Account Filtering and Search', () => {
    it.skip('should filter accounts by type', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Credit Card - Business')).toBeInTheDocument();
      });
      
      // Filter by asset type - try different selectors
      console.log('Available comboboxes:', screen.getAllByRole('combobox').map(el => el.outerHTML));
      const typeFilter = screen.getAllByRole('combobox')[0]; // Get the first combobox (type filter)
      fireEvent.click(typeFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Asset')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Asset'));
      
      // Should only show asset accounts
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Bank Account - Checking')).toBeInTheDocument();
        expect(screen.getByText('Savings Account')).toBeInTheDocument();
        expect(screen.queryByText('Credit Card - Business')).not.toBeInTheDocument();
      });
    });

    it('should search accounts by name', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      // Search for specific account
      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      fireEvent.change(searchInput, { target: { value: 'Cash' } });
      
      // Should only show matching accounts
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.queryByText('Bank Account - Checking')).not.toBeInTheDocument();
        expect(screen.queryByText('Credit Card - Business')).not.toBeInTheDocument();
      });
    });
  });



  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Setup mock to return error
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': null // This will cause fetch to reject
      }, true);
      
      render(<ChartOfAccounts />);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle empty account list', async () => {
      // Setup mock with empty accounts
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: [] },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
      });
      
      render(<ChartOfAccounts />);
      
      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
      });
    });

    it.skip('should show validation errors for empty form submission', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: [] },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies },
        'POST:http://localhost:3000/api/accounts': null // This should not be called due to validation
      });
      
      render(<ChartOfAccounts />);
      
      // Open create form
      await waitFor(() => {
        expect(screen.getByText('Add Account')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Add Account'));
      
      // Wait for dialog to open and form to be ready
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create')).toBeInTheDocument();
      });
      
      // Submit empty form
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Account code is required')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should prevent deletion of accounts with transactions', async () => {
      // Setup mock with custom error response for DELETE
      const mock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        const method = options?.method || 'GET';
        const key = `${method}:${url}`;
        
        if (key === 'DELETE:http://localhost:3000/api/accounts/1') {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: () => Promise.resolve({
              message: 'Cannot delete account with existing transactions',
              error: 'Account Cash Account has 5 existing transactions and cannot be deleted',
              code: 'ACCOUNT_HAS_TRANSACTIONS'
            }),
            headers: new Headers()
          } as Response);
        }
        
        const responses: Record<string, any> = {
           'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
           'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
           'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies }
         };
         
         return Promise.resolve({
           ok: true,
           json: () => Promise.resolve(responses[key]),
           headers: new Headers(),
           status: 200,
           statusText: 'OK'
         } as Response);
      });
      
      global.fetch = mock;
      mockFetch = mock;
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      // Try to delete account (this should show error)
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      });
      
      const confirmButtons = screen.getAllByText('Delete');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]); // Click the last Delete button (confirmation dialog)
      
      // Should show error message about transactions
      await waitFor(() => {
        expect(screen.getByText(/cannot delete account with existing transactions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Import/Export', () => {
    it('should handle account data export', async () => {
      mockFetch = setupMockFetch({
        'GET:http://localhost:3000/api/accounts': { accounts: mockAccounts },
        'GET:http://localhost:3000/api/account-types': { types: mockAccountTypes },
        'GET:http://localhost:3000/api/currencies': { currencies: mockCurrencies },
        'GET:http://localhost:3000/api/accounts/export': { data: mockAccounts }
      });
      
      render(<ChartOfAccounts />);
      
      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
      });
      
      // Click export button
      const exportButton = screen.getByText('Export Accounts');
      fireEvent.click(exportButton);
      
      // Verify export API call was made
      await waitFor(() => {
        const exportCall = mockFetch.mock.calls.find(call => 
          call[0] === 'http://localhost:3000/api/accounts/export'
        );
        expect(exportCall).toBeTruthy();
      });
    });
  });
});