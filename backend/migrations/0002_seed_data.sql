-- 0002_seed_data.sql
-- Seed data for development and testing

-- Insert test user
INSERT OR IGNORE INTO users (id, email, name, password_hash, created_at, updated_at)
VALUES (
	'user-test-001',
	'test@example.com',
	'Test User',
	'$2a$10$dummy_hash_for_testing_only',
	datetime('now'),
	datetime('now')
);

-- Insert roles
INSERT OR IGNORE INTO roles (id, name, description, created_at, updated_at) VALUES
	('role-admin', 'admin', 'Full system access', datetime('now'), datetime('now')),
	('role-user', 'user', 'Standard user access', datetime('now'), datetime('now'));

-- Assign admin role to test user
INSERT OR IGNORE INTO user_roles (user_id, role_id)
VALUES ('user-test-001', 'role-admin');

-- Insert test entities
INSERT OR IGNORE INTO entities (id, user_id, name, type, currency, created_at, updated_at) VALUES
	('entity-personal', 'user-test-001', 'Personal', 'personal', 'USD', datetime('now'), datetime('now')),
	('entity-business-a', 'user-test-001', 'Business A', 'business', 'USD', datetime('now'), datetime('now'));

-- Insert test accounts
INSERT OR IGNORE INTO accounts (id, entity_id, name, type, currency, balance, is_active, created_at, updated_at) VALUES
	('acct-checking', 'entity-personal', 'Primary Checking', 'checking', 'USD', 5000.00, 1, datetime('now'), datetime('now')),
	('acct-savings', 'entity-personal', 'Emergency Savings', 'savings', 'USD', 10000.00, 1, datetime('now'), datetime('now')),
	('acct-business', 'entity-business-a', 'Business Checking', 'checking', 'USD', 25000.00, 1, datetime('now'), datetime('now')),
	('acct-credit', 'entity-personal', 'Credit Card', 'credit_card', 'USD', -1500.00, 1, datetime('now'), datetime('now'));

-- Insert sample transactions
INSERT OR IGNORE INTO transactions (id, entity_id, account_id, type, category, amount, currency, date, description, is_reconciled, created_at, updated_at) VALUES
	('txn-001', 'entity-personal', 'acct-checking', 'expense', 'groceries', 150.00, 'USD', datetime('now', 'Weekly grocery shopping', 1, datetime('now'), datetime('now')),
	('txn-002', 'entity-personal', 'acct-checking', 'expense', 'utilities', 250.00, 'USD', datetime('now'), 'Monthly utility bills', 1, datetime('now'), datetime('now')),
	('txn-003', 'entity-personal', 'acct-checking', 'income', 'salary', 5000.00, 'USD', datetime('now'), 'Monthly salary', 1, datetime('now'), datetime('now')),
	('txn-004', 'entity-business-a', 'acct-business', 'expense', 'supplies', 500.00, 'USD', datetime('now'), 'Office supplies', 1, datetime('now'), datetime('now')),
	('txn-005', 'entity-business-a', 'acct-business', 'income', 'sales', 7500.00, 'USD', datetime('now'), 'Client payment', 1, datetime('now'), datetime('now'));

-- Insert double-entry journal entries for transactions
INSERT OR IGNORE INTO journal_entries (id, transaction_id, account_id, amount, type, description, created_at, updated_at) VALUES
	('je-001', 'txn-001', 'acct-checking', 150.00, 'debit', 'Grocery purchase', datetime('now'), datetime('now')),
	('je-002', 'txn-001', 'acct-checking', 150.00, 'credit', 'Grocery purchase credit', datetime('now'), datetime('now')),
	('je-003', 'txn-002', 'acct-checking', 250.00, 'debit', 'Utility payment', datetime('now'), datetime('now')),
	('je-004', 'txn-002', 'acct-checking', 250.00, 'credit', 'Utility payment credit', datetime('now'), datetime('now')),
	('je-005', 'txn-003', 'acct-checking', 5000.00, 'credit', 'Salary deposit', datetime('now'), datetime('now')),
	('je-006', 'txn-003', 'acct-checking', 5000.00, 'debit', 'Salary deposit debit', datetime('now'), datetime('now')),
	('je-007', 'txn-004', 'acct-business', 500.00, 'debit', 'Supply purchase', datetime('now'), datetime('now')),
	('je-008', 'txn-004', 'acct-business', 500.00, 'credit', 'Supply purchase credit', datetime('now'), datetime('now')),
	('je-009', 'txn-005', 'acct-business', 7500.00, 'credit', 'Client payment received', datetime('now'), datetime('now')),
	('je-010', 'txn-005', 'acct-business', 7500.00, 'debit', 'Client payment debit', datetime('now'), datetime('now'));
