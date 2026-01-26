package migrations

import "time"

// BaseEntity represents a base entity with common fields
type BaseEntity struct {
	ID        string    `json:"id" db:"id,primaryKey"`
	CreatedAt time.Time `json:"createdAt" db:"created_at,notNull"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at,notNull"`
}

// User represents a system user
type User struct {
	BaseEntity
	Email        string `json:"email" db:"email,unique,notNull"`
	Name         string `json:"name" db:"name,notNull"`
	PasswordHash string `json:"-" db:"password_hash,notNull"`
}

// Role represents a user role (admin, user, etc.)
type Role struct {
	BaseEntity
	Name        string `json:"name" db:"name,unique,notNull"`
	Description string `json:"description" db:"description"`
}

// UserRole represents many-to-many relationship between users and roles
type UserRole struct {
	UserID string `json:"userId" db:"user_id,notNull"`
	RoleID string `json:"roleId" db:"role_id,notNull"`
}

// Entity represents a user's finance context (personal, business A, etc.)
type Entity struct {
	BaseEntity
	UserID   string `json:"userId" db:"user_id,notNull"`
	Name     string `json:"name" db:"name,notNull"`
	Type     string `json:"type" db:"type,notNull"`
	Currency string `json:"currency" db:"currency,notNull,defaultValue:'USD'"`
}

// Account represents a financial account (bank, cash, credit card)
type Account struct {
	BaseEntity
	EntityID string  `json:"entityId" db:"entity_id,notNull"`
	Name     string  `json:"name" db:"name,notNull"`
	Type     string  `json:"type" db:"type,notNull"`
	Currency string  `json:"currency" db:"currency,notNull,defaultValue:'USD'"`
	Balance  float64 `json:"balance" db:"balance,notNull,defaultValue:0"`
	IsActive bool    `json:"isActive" db:"is_active,notNull,defaultValue:true"`
}

// Transaction represents a financial transaction
type Transaction struct {
	BaseEntity
	EntityID     string    `json:"entityId" db:"entity_id,notNull"`
	AccountID    string    `json:"accountId" db:"account_id,notNull"`
	Type         string    `json:"type" db:"type,notNull"`
	Category     string    `json:"category" db:"category,notNull"`
	Amount       float64   `json:"amount" db:"amount,notNull"`
	Currency     string    `json:"currency" db:"currency,notNull,defaultValue:'USD'"`
	Date         time.Time `json:"date" db:"date,notNull"`
	Description  string    `json:"description" db:"description"`
	Metadata     string    `json:"metadata" db:"metadata"`
	IsReconciled bool      `json:"isReconciled" db:"is_reconciled,notNull,defaultValue:false"`
}

// JournalEntry represents a double-entry journal entry
type JournalEntry struct {
	BaseEntity
	TransactionID string  `json:"transactionId" db:"transaction_id,notNull"`
	AccountID     string  `json:"accountId" db:"account_id,notNull"`
	Amount        float64 `json:"amount" db:"amount,notNull"`
	Type          string  `json:"type" db:"type,notNull"` // debit or credit
	Description   string  `json:"description" db:"description"`
}

// Document represents a stored document (receipt, invoice, etc.)
type Document struct {
	BaseEntity
	EntityID      string `json:"entityId" db:"entity_id,notNull"`
	TransactionID string `json:"transactionId" db:"transaction_id"`
	Name          string `json:"name" db:"name,notNull"`
	Type          string `json:"type" db:"type,notNull"`
	StorageKey    string `json:"storageKey" db:"storage_key,notNull"`
	Size          int64  `json:"size" db:"size,notNull"`
	ContentType   string `json:"contentType" db:"content_type"`
}

// VectorEmbedding represents a document embedding for semantic search
type VectorEmbedding struct {
	ID         string    `json:"id" db:"id,primaryKey"`
	DocumentID string    `json:"documentId" db:"document_id,notNull"`
	VectorID   string    `json:"vectorId" db:"vector_id,notNull"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at,notNull"`
}
