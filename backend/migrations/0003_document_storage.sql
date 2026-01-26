-- 0003_document_storage.sql
-- Document storage schema for receipts, invoices, statements

CREATE TABLE IF NOT EXISTS document_types (
	id TEXT PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	description TEXT,
	mime_types TEXT, -- Array of allowed MIME types
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced documents table with versioning
CREATE TABLE IF NOT EXISTS documents_v2 (
	id TEXT PRIMARY KEY,
	entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
	transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
	document_type_id TEXT NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
	name TEXT NOT NULL,
	type TEXT NOT NULL, -- 'receipt', 'invoice', 'statement', 'contract'
	storage_key TEXT NOT NULL,
	size INTEGER NOT NULL,
	content_type TEXT,
	hash TEXT, -- Content hash for deduplication
	status TEXT DEFAULT 'active', -- 'active', 'archived', 'deleted'
	version INTEGER DEFAULT 1, -- Document version for updates
	parent_id TEXT REFERENCES documents_v2(id) ON DELETE SET NULL, -- For document revisions
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Document tags for categorization
CREATE TABLE IF NOT EXISTS document_tags (
	id TEXT PRIMARY KEY,
	document_id TEXT NOT NULL REFERENCES documents_v2(id) ON DELETE CASCADE,
	tag TEXT NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_v2_entity_id ON documents_v2(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_v2_transaction_id ON documents_v2(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_v2_status ON documents_v2(status);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);

-- Seed document types
INSERT OR IGNORE INTO document_types (id, name, description) VALUES
('doc-receipt', 'Receipt', 'Point-of-sale or purchase receipt'),
('doc-invoice', 'Invoice', 'Vendor or supplier invoice'),
('doc-statement', 'Statement', 'Bank or credit card statement'),
('doc-contract', 'Contract', 'Legal agreement or contract'),
('doc-estimate', 'Estimate', 'Price or cost estimate'),
('doc-receipt-vendor', 'Vendor Receipt', 'Supplier receipt'),
('doc-tax', 'Tax Document', 'Tax return or W-2');
