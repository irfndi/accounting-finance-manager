import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  category?: string;
  description?: string;
  parentId?: number | null;
  level: number;
  path: string;
  isActive: boolean;
  isSystem: boolean;
  allowTransactions: boolean;
  normalBalance: string;
  currentBalance: number;
  reportCategory: string;
  reportOrder: number;
  formattedBalance?: string;
  accountingInfo?: {
    canHaveChildren: boolean;
    expectedNormalBalance: string;
    isBalanceSheet: boolean;
    isIncomeStatement: boolean;
  };
  children?: Account[];
}

interface CreateAccountData {
  code: string;
  name: string;
  type: string;
  subtype?: string;
  category?: string;
  description?: string;
  parentId?: number | null;
  isActive: boolean;
  allowTransactions: boolean;
  reportOrder: number;
}

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

const API_BASE_URL = typeof window !== 'undefined' 
  ? ((import.meta as any).env?.PUBLIC_API_BASE_URL || window.location.origin)
  : 'http://localhost:3000';

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set<string>());

  const [formData, setFormData] = useState<CreateAccountData>({
    code: '',
    name: '',
    type: '',
    subtype: '',
    category: '',
    description: '',
    parentId: undefined,
    isActive: true,
    allowTransactions: true,
    reportOrder: 0,
  });

  // Fetch accounts from API
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/accounts`);
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }
      const data = await response.json() as { accounts: Account[] };
      setAccounts(data.accounts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  // Create or update account
  const saveAccount = async () => {
    try {
      const url = editingAccount
        ? `${API_BASE_URL}/api/accounts/${editingAccount.id}`
        : `${API_BASE_URL}/api/accounts`;
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Failed to save account');
      }

      await fetchAccounts();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    }
  };

  // Delete account
  const handleDeleteRequest = (account: Account) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${accountToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Failed to delete account');
      }

      await fetchAccounts();
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleteDialogOpen(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: '',
      subtype: '',
      category: '',
      description: '',
      parentId: undefined,
      isActive: true,
      allowTransactions: true,
      reportOrder: 0,
    });
    setEditingAccount(null);
  };

  // Open edit dialog
  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      subtype: account.subtype || '',
      category: account.category || '',
      description: account.description || '',
      parentId: account.parentId || null,
      isActive: account.isActive,
      allowTransactions: account.allowTransactions,
      reportOrder: account.reportOrder,
    });
    setIsDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Toggle account expansion
  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  // Build hierarchical account structure
  const buildAccountHierarchy = (accounts: Account[]): Account[] => {
    const accountMap = new Map<number, Account>();
    const rootAccounts: Account[] = [];

    // Create map of all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!;
        parent.children!.push(accountWithChildren);
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    return rootAccounts;
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesType;
  });
  


  // Render account row
  const renderAccountRow = (account: Account, level: number = 0): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id.toString());
    const indent = level * 20;

    rows.push(
      <TableRow key={account.id} className={level > 0 ? 'bg-gray-50' : ''}>
        <TableCell style={{ paddingLeft: `${16 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(account.id.toString())}
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <span className="font-mono text-sm">{account.code}</span>
          </div>
        </TableCell>
        <TableCell>{account.name}</TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            account.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
            account.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
            account.type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
            account.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {account.type}
          </span>
        </TableCell>
        <TableCell className="text-right font-mono">
          {account.formattedBalance || '$0.00'}
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs ${
            account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {account.isActive ? 'Active' : 'Inactive'}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(account)}
            >
              Edit
            </Button>
            {!account.isSystem && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRequest(account)}
              >
                Delete
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );

    // Add child rows if expanded
    if (hasChildren && isExpanded) {
      account.children!.forEach(child => {
        rows.push(...renderAccountRow(child, level + 1));
      });
    }

    return rows;
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const hierarchicalAccounts = buildAccountHierarchy(filteredAccounts);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading accounts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account
              <strong>{accountToDelete?.name}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccountToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chart of Accounts</CardTitle>
            <Button onClick={openCreateDialog}>
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACCOUNT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accounts Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hierarchicalAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                hierarchicalAccounts.map(account => renderAccountRow(account))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? `Edit Account: ${editingAccount.name}` : 'Create New Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update account information' : 'Add a new account to the chart of accounts'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Account Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cash and Cash Equivalents"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label htmlFor="parentId">Parent Account</Label>
              <Select
                value={formData.parentId?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, parentId: value ? parseInt(value) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""><em>No Parent</em></SelectItem>
                  {accounts
                    .filter(acc => ['ASSET', 'LIABILITY', 'EQUITY'].includes(acc.type) && acc.id !== editingAccount?.id)
                    .map(parent => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.name} ({parent.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtype">Subtype</Label>
                <Input
                  id="subtype"
                  value={formData.subtype}
                  onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="parentId">Parent Account</Label>
              <Select value={formData.parentId?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, parentId: value ? parseInt(value) : null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Parent</SelectItem>
                  {accounts
                    .filter(acc => acc.accountingInfo?.canHaveChildren && acc.id !== editingAccount?.id)
                    .map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowTransactions"
                  checked={formData.allowTransactions}
                  onChange={(e) => setFormData({ ...formData, allowTransactions: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="allowTransactions">Allow Transactions</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAccount}>
              {editingAccount ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}