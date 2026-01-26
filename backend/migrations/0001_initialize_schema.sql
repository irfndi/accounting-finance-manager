-- 0001_initialize_schema.sql
-- Double-entry accounting schema for Finance Manager

-- Users table
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	name TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
	id TEXT PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	description TEXT,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User-Role junction table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
	PRIMARY KEY (user_id, role_id)
);

-- Entities table (multi-tenant finance contexts)
CREATE TABLE IF NOT EXISTS entities (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	type TEXT NOT NULL,
	currency TEXT NOT NULL DEFAULT 'USD',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
	id TEXT PRIMARY KEY,
	entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	type TEXT NOT NULL,
	currency TEXT NOT NULL DEFAULT 'USD',
	balance REAL NOT NULL DEFAULT 0,
	is_active INTEGER NOT NULL DEFAULT 1,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
	id TEXT PRIMARY KEY,
	entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
	type TEXT NOT NULL,
	category TEXT NOT NULL,
	amount REAL NOT NULL,
	currency TEXT NOT NULL DEFAULT 'USD',
	date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	description TEXT,
	metadata TEXT,
	is_reconciled INTEGER NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries table (double-entry accounting)
CREATE TABLE IF NOT EXISTS journal_entries (
	id TEXT PRIMARY KEY,
	transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
	amount REAL NOT NULL,
	type TEXT NOT NULL, -- 'debit' or 'credit'
	description TEXT,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (R2 storage references)
CREATE TABLE IF NOT EXISTS documents (
	id TEXT PRIMARY KEY,
	entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
	transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
	name TEXT NOT NULL,
	type TEXT NOT NULL,
	storage_key TEXT NOT NULL,
	size INTEGER NOT NULL,
	content_type TEXT,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vector Embeddings table (for semantic search)
CREATE TABLE IF NOT EXISTS vector_embeddings (
	id TEXT PRIMARY KEY,
	document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
	vector_id TEXT NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_entity_id ON accounts(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_entity_id ON transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction_id ON journal_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_id ON journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction_id ON documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_document_id ON vector_embeddings(document_id);
