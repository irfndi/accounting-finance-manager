-- Finance Manager Initial Data Seeding
-- Migration: 002_initial_data.sql

-- Insert default account types
INSERT INTO accounts (code, name, account_type) VALUES
('1000', 'Assets', 'asset'),
('2000', 'Liabilities', 'liability'),
('3000', 'Equity', 'equity'),
('4000', 'Revenue', 'revenue'),
('5000', 'Expenses', 'expense');

-- Insert default asset accounts
INSERT INTO accounts (code, name, account_type, parent_id) VALUES
('1100', 'Current Assets', 'asset', (SELECT id FROM accounts WHERE code = '1000')),
('1110', 'Cash and Cash Equivalents', 'asset', (SELECT id FROM accounts WHERE code = '1100')),
('1120', 'Accounts Receivable', 'asset', (SELECT id FROM accounts WHERE code = '1100')),
('1130', 'Inventory', 'asset', (SELECT id FROM accounts WHERE code = '1100')),
('1140', 'Prepaid Expenses', 'asset', (SELECT id FROM accounts WHERE code = '1100')),
('1200', 'Fixed Assets', 'asset', (SELECT id FROM accounts WHERE code = '1000')),
('1210', 'Property, Plant & Equipment', 'asset', (SELECT id FROM accounts WHERE code = '1200')),
('1220', 'Accumulated Depreciation', 'asset', (SELECT id FROM accounts WHERE code = '1200'));

-- Insert default liability accounts
INSERT INTO accounts (code, name, account_type, parent_id) VALUES
('2100', 'Current Liabilities', 'liability', (SELECT id FROM accounts WHERE code = '2000')),
('2110', 'Accounts Payable', 'liability', (SELECT id FROM accounts WHERE code = '2100')),
('2120', 'Accrued Expenses', 'liability', (SELECT id FROM accounts WHERE code = '2100')),
('2130', 'Short-term Debt', 'liability', (SELECT id FROM accounts WHERE code = '2100')),
('2200', 'Long-term Liabilities', 'liability', (SELECT id FROM accounts WHERE code = '2000')),
('2210', 'Long-term Debt', 'liability', (SELECT id FROM accounts WHERE code = '2200'));

-- Insert default equity accounts
INSERT INTO accounts (code, name, account_type, parent_id) VALUES
('3100', 'Owner\'s Equity', 'equity', (SELECT id FROM accounts WHERE code = '3000')),
('3110', 'Capital', 'equity', (SELECT id FROM accounts WHERE code = '3100')),
('3120', 'Retained Earnings', 'equity', (SELECT id FROM accounts WHERE code = '3100')),
('3130', 'Drawings', 'equity', (SELECT id FROM accounts WHERE code = '3100'));

-- Insert default revenue accounts
INSERT INTO accounts (code, name, account_type, parent_id) VALUES
('4100', 'Operating Revenue', 'revenue', (SELECT id FROM accounts WHERE code = '4000')),
('4110', 'Sales Revenue', 'revenue', (SELECT id FROM accounts WHERE code = '4100')),
('4120', 'Service Revenue', 'revenue', (SELECT id FROM accounts WHERE code = '4100')),
('4200', 'Other Revenue', 'revenue', (SELECT id FROM accounts WHERE code = '4000')),
('4210', 'Interest Income', 'revenue', (SELECT id FROM accounts WHERE code = '4200')),
('4220', 'Investment Income', 'revenue', (SELECT id FROM accounts WHERE code = '4200'));

-- Insert default expense accounts
INSERT INTO accounts (code, name, account_type, parent_id) VALUES
('5100', 'Operating Expenses', 'expense', (SELECT id FROM accounts WHERE code = '5000')),
('5110', 'Cost of Goods Sold', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5120', 'Salaries and Wages', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5130', 'Rent Expense', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5140', 'Utilities Expense', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5150', 'Office Supplies', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5160', 'Travel Expense', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5170', 'Professional Services', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5180', 'Software & Subscriptions', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5190', 'Meals & Entertainment', 'expense', (SELECT id FROM accounts WHERE code = '5100')),
('5200', 'Administrative Expenses', 'expense', (SELECT id FROM accounts WHERE code = '5000')),
('5210', 'Insurance Expense', 'expense', (SELECT id FROM accounts WHERE code = '5200')),
('5220', 'Depreciation Expense', 'expense', (SELECT id FROM accounts WHERE code = '5200')),
('5230', 'Interest Expense', 'expense', (SELECT id FROM accounts WHERE code = '5200'));

-- Insert default categories
INSERT INTO categories (name, description, category_type) VALUES
('Office Supplies', 'General office supplies and materials', 'expense'),
('Travel', 'Business travel and transportation', 'expense'),
('Meals & Entertainment', 'Business meals and entertainment', 'expense'),
('Software & Subscriptions', 'Software licenses and subscriptions', 'expense'),
('Professional Services', 'Legal, accounting, and consulting services', 'expense'),
('Utilities', 'Electricity, water, gas, internet, phone', 'expense'),
('Rent & Facilities', 'Office rent and facility costs', 'expense'),
('Marketing & Advertising', 'Marketing campaigns and advertising costs', 'expense'),
('Insurance', 'Business insurance premiums', 'expense'),
('Equipment & Hardware', 'Computer equipment and hardware purchases', 'expense'),
('Sales Revenue', 'Revenue from product or service sales', 'revenue'),
('Consulting Revenue', 'Revenue from consulting services', 'revenue'),
('Interest Income', 'Income from investments and savings', 'revenue'),
('Other Income', 'Miscellaneous income sources', 'revenue');