# Finance Manager - Database Schema Documentation

## Overview

The Finance Manager database implements a double-entry accounting system with multi-tenant support, role-based access control (RBAC), and AI-powered semantic search capabilities.

## Design Principles

### Double-Entry Accounting

- Every financial transaction must have balanced debit and credit entries
- Ensures accuracy and prevents errors through self-balancing mechanism
- Full audit trail via journal entries table

### Multi-Tenancy

- Users can have multiple entities (personal, business A, business B)
- Data isolation via foreign key constraints with cascading deletes
- Each entity maintains separate accounts and transactions

### Security (RBAC)

- User-Role junction table for flexible permission assignment
- Role-based access control (admin, user, viewer, etc.)
- Users can have multiple roles

## Schema Relationships

```
users (1) ----< user_roles >---- (*) roles (M)
  |
  v
entities (N)
  |
  +---- accounts (N)
  |
  v
transactions (N)
  |
  +---- journal_entries (M)

entities (N) ----< documents (N) ----< vector_embeddings (M)
```

## Tables

### users

System users with authentication credentials.

| Column        | Type             | Description                                    |
| ------------- | ---------------- | ---------------------------------------------- |
| id            | TEXT PRIMARY KEY | Unique user identifier                         |
| email         | TEXT UNIQUE      | Email for login, must be unique                |
| name          | TEXT             | Display name                                   |
| password_hash | TEXT             | Bcrypt hash of password (never exposed in API) |
| created_at    | DATETIME         | Account creation timestamp                     |
| updated_at    | DATETIME         | Last update timestamp                          |

**Indexes:** `idx_users_email` on email

---

### roles

User roles for RBAC system.

| Column      | Type             | Description                                       |
| ----------- | ---------------- | ------------------------------------------------- |
| id          | TEXT PRIMARY KEY | Role identifier (e.g., 'role-admin', 'role-user') |
| name        | TEXT UNIQUE      | Display name (e.g., 'Admin', 'User')              |
| description | TEXT             | Role description and capabilities                 |
| created_at  | DATETIME         | Creation timestamp                                |
| updated_at  | DATETIME         | Last update timestamp                             |

**Default Roles:**

- `role-admin`: Full system access
- `role-user`: Standard user access
- `role-viewer`: Read-only access

---

### user_roles

Many-to-many junction table between users and roles.

| Column  | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| user_id | TEXT FK | References users(id), CASCADE delete |
| role_id | TEXT FK | References roles(id), CASCADE delete |

**Constraints:** PRIMARY KEY (user_id, role_id)

**Usage:**

```sql
-- Assign admin role to user
INSERT INTO user_roles (user_id, role_id) VALUES ('user-001', 'role-admin');
```

---

### entities

Multi-tenant finance contexts (personal accounts, business entities, etc.).

| Column     | Type             | Description                                  |
| ---------- | ---------------- | -------------------------------------------- |
| id         | TEXT PRIMARY KEY | Entity identifier                            |
| user_id    | TEXT FK          | References users(id), CASCADE delete         |
| name       | TEXT             | Entity name (e.g., "Personal", "Business A") |
| type       | TEXT             | Entity type (personal, business, investment) |
| currency   | TEXT             | Default currency for entity (default: 'USD') |
| created_at | DATETIME         | Entity creation timestamp                    |
| updated_at | DATETIME         | Last update timestamp                        |

**Indexes:** `idx_entities_user_id` on user_id

**Example:**

```sql
-- Create personal entity
INSERT INTO entities (id, user_id, name, type, currency) VALUES
('entity-personal', 'user-001', 'Personal', 'personal', 'USD');

-- Create business entity
INSERT INTO entities (id, user_id, name, type, currency) VALUES
('entity-business', 'user-001', 'Business A', 'business', 'USD');
```

---

### accounts

Financial accounts (checking, savings, credit cards, etc.).

| Column     | Type             | Description                                               |
| ---------- | ---------------- | --------------------------------------------------------- |
| id         | TEXT PRIMARY KEY | Account identifier                                        |
| entity_id  | TEXT FK          | References entities(id), CASCADE delete                   |
| name       | TEXT             | Account name (e.g., "Primary Checking")                   |
| type       | TEXT             | Account type (checking, savings, credit_card, investment) |
| currency   | TEXT             | Account currency (default: 'USD')                         |
| balance    | REAL             | Current balance (default: 0)                              |
| is_active  | BOOLEAN          | Account status (default: true)                            |
| created_at | DATETIME         | Account creation timestamp                                |
| updated_at | DATETIME         | Last update timestamp                                     |

**Indexes:** `idx_accounts_entity_id` on entity_id

**Account Types:**

- `checking`: Checking accounts
- `savings`: Savings accounts
- `credit_card`: Credit cards (negative balance = debt)
- `investment`: Investment accounts

**Example:**

```sql
-- Create checking account
INSERT INTO accounts (id, entity_id, name, type, balance) VALUES
('acct-001', 'entity-personal', 'Primary Checking', 'checking', 0, 5000.00);

-- Create savings account
INSERT INTO accounts (id, entity_id, name, type, balance) VALUES
('acct-002', 'entity-personal', 'Emergency Savings', 'savings', 0, 10000.00);
```

---

### transactions

Financial transactions (income, expenses, transfers).

| Column        | Type             | Description                                                                  |
| ------------- | ---------------- | ---------------------------------------------------------------------------- |
| id            | TEXT PRIMARY KEY | Transaction identifier                                                       |
| entity_id     | TEXT FK          | References entities(id), CASCADE delete                                      |
| account_id    | TEXT FK          | References accounts(id), RESTRICT delete (prevents orphaned journal entries) |
| type          | TEXT             | Transaction type (income, expense, transfer)                                 |
| category      | TEXT             | Transaction category (e.g., "groceries", "salary")                           |
| amount        | REAL             | Transaction amount (positive for all types, sign comes from category)        |
| currency      | TEXT             | Transaction currency (default: 'USD')                                        |
| date          | DATETIME         | Transaction date                                                             |
| description   | TEXT             | Optional description                                                         |
| metadata      | TEXT             | JSON metadata for additional info                                            |
| is_reconciled | BOOLEAN          | Reconciliation status (default: false)                                       |
| created_at    | DATETIME         | Transaction creation timestamp                                               |
| updated_at    | DATETIME         | Last update timestamp                                                        |

**Indexes:**

- `idx_transactions_entity_id` on entity_id
- `idx_transactions_account_id` on account_id
- `idx_transactions_date` on date DESC

**Transaction Types:**

- `income`: Money coming in (salary, investment returns, etc.)
- `expense`: Money going out (groceries, utilities, etc.)
- `transfer`: Moving money between accounts

**Example:**

```sql
-- Income transaction
INSERT INTO transactions (entity_id, account_id, type, category, amount) VALUES
('entity-personal', 'acct-001', 'income', 'salary', 5000.00);

-- Expense transaction
INSERT INTO transactions (entity_id, account_id, type, category, amount) VALUES
('entity-personal', 'acct-001', 'expense', 'groceries', 150.00);
```

---

### journal_entries

Double-entry accounting entries ensuring balance.

| Column         | Type             | Description                                 |
| -------------- | ---------------- | ------------------------------------------- |
| id             | TEXT PRIMARY KEY | Journal entry identifier                    |
| transaction_id | TEXT FK          | References transactions(id), CASCADE delete |
| account_id     | TEXT FK          | References accounts(id), RESTRICT delete    |
| amount         | REAL             | Entry amount (can be positive or negative)  |
| type           | TEXT             | Entry type - 'debit' or 'credit'            |
| description    | TEXT             | Entry description                           |
| created_at     | DATETIME         | Entry creation timestamp                    |
| updated_at     | DATETIME         | Last update timestamp                       |

**Indexes:**

- `idx_journal_entries_transaction_id` on transaction_id
- `idx_journal_entries_account_id` on account_id

**Double-Entry Rules:**

- Every transaction must have equal total debit and credit amounts
- Debit increases account balance, credit decreases account balance
- Self-balancing ensures no missing entries

**Example:**

```sql
-- For a $150 grocery expense from checking:
INSERT INTO journal_entries (transaction_id, account_id, amount, type, description) VALUES
('txn-001', 'acct-001', 150.00, 'debit', 'Grocery purchase');

INSERT INTO journal_entries (transaction_id, account_id, amount, type, description) VALUES
('txn-001', 'acct-001', 150.00, 'credit', 'Grocery purchase credit');
```

---

### documents

Document storage references (R2 bucket).

| Column         | Type             | Description                                                                         |
| -------------- | ---------------- | ----------------------------------------------------------------------------------- |
| id             | TEXT PRIMARY KEY | Document identifier                                                                 |
| entity_id      | TEXT FK          | References entities(id), CASCADE delete                                             |
| transaction_id | TEXT FK          | References transactions(id), SET NULL (transaction can be deleted without document) |
| name           | TEXT             | Document name (e.g., "receipt_jan_2024.pdf")                                        |
| type           | TEXT             | Document type (receipt, invoice, statement)                                         |
| storage_key    | TEXT             | R2 storage key                                                                      |
| size           | INTEGER          | Document size in bytes                                                              |
| content_type   | TEXT             | MIME type (e.g., "application/pdf")                                                 |
| created_at     | DATETIME         | Document upload timestamp                                                           |
| updated_at     | DATETIME         | Last update timestamp                                                               |

**Indexes:**

- `idx_documents_entity_id` on entity_id
- `idx_documents_transaction_id` on transaction_id

**Document Types:**

- `receipt`: Purchase receipts
- `invoice`: Vendor invoices
- `statement`: Bank statements
- `contract`: Contracts and agreements

---

### vector_embeddings

Semantic search embeddings for AI-powered features.

| Column      | Type             | Description                              |
| ----------- | ---------------- | ---------------------------------------- |
| id          | TEXT PRIMARY KEY | Embedding record identifier              |
| document_id | TEXT FK          | References documents(id), CASCADE delete |
| vector_id   | TEXT             | Vectorize index ID                       |
| created_at  | DATETIME         | Embedding creation timestamp             |

**Indexes:** `idx_vector_embeddings_document_id` on document_id

**Usage:**

- Store document embeddings for semantic search
- Find similar transactions or documents
- Power AI categorization and recommendations

---

## Performance Optimization

### Indexes

All frequently queried columns have indexes:

- Foreign keys for JOIN operations
- Date columns for time-based queries
- Entity/user relationships for multi-tenant lookups

### Connection Pooling

- Max open connections: 10
- Max idle connections: 5
- Configured in D1 client

## Migration System

### Migration Files

- `0001_initialize_schema.sql`: Creates all tables and indexes
- `0002_seed_data.sql`: Inserts test data

### Migrator Features

- Transaction-based migrations (all-or-nothing)
- Version tracking via `schema_migrations` table
- Automatic rollback support (not yet implemented)

## Data Integrity

### Foreign Key Constraints

- CASCADE deletes: users → entities, accounts, documents, journal_entries
- RESTRICT deletes: accounts → transactions, journal_entries (prevents orphaned data)
- SET NULL: documents → transactions (transaction can exist without documents)

### Constraints

- UNIQUE: users.email, roles.name
- NOT NULL: All required fields
- DEFAULT: sensible defaults (balance=0, currency='USD')

## Cloudflare D1 Integration

### Configuration

- Database ID: `11bc7825-db1f-4ab4-8009-15254c808ba5`
- Connection: `d1:{database_id}` DSN
- Migration dir: `../migrations` relative to backend

### Time Travel

- D1 supports historical queries (7 days in production)
- Enabled via database configuration
- Useful for audit trails and reconciliation

## Cloudflare R2 Integration

### Storage

- Documents stored in `fininflow-documents-prod` bucket
- Storage keys tracked in `documents.storage_key` column
- Access via backend `internal/r2` package

## Cloudflare Vectorize Integration

### Semantic Search

- Index: `fininflow-documents-prod`
- Dimensions: 768
- Metric: cosine
- Capacity: 10M vectors

### Usage

- Document embeddings stored in `vector_embeddings` table
- Enables similarity search across transactions and documents
- Powers AI categorization and recommendations

## Seed Data

### Test Data Includes

- 1 user (`test@example.com`)
- 2 roles (`admin`, `user`)
- 2 entities (`Personal`, `Business A`)
- 4 accounts (`Checking`, `Savings`, `Business`, `Credit Card`)
- 5 transactions (income and expenses)
- 10 journal entries (double-entry balanced)

### Accounts

- Checking: $5,000.00
- Savings: $10,000.00
- Business: $25,000.00
- Credit Card: -$1,500.00 (debt)

### Transactions

- Income: $12,500.00
- Expenses: $900.00
- Net: $11,600.00

## Security Considerations

### Authentication

- Passwords stored as bcrypt hashes
- Never expose password_hash in API responses
- JWT-based authentication via middleware

### Authorization

- RBAC via user_roles table
- Role-based permission checking
- Entity-level data isolation

### Data Access

- User can only access their entities and data
- Foreign key cascades ensure cleanup on user deletion
- Account-level restrictions prevent unauthorized transfers

## Future Enhancements

### Planned

- [ ] Implement migration rollback/down scripts
- [ ] Add time travel queries documentation
- [ ] Implement read replica configuration
- [ ] Add document versioning
- [ ] Implement transaction categorization via ML
- [ ] Add audit logging table

### Performance

- [ ] Query optimization benchmarking
- [ ] Index usage analysis
- [ ] Connection pool monitoring
- [ ] Caching strategy for frequently accessed data
