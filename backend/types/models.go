package types

import "time"

// Transaction represents a financial transaction
type Transaction struct {
	ID          string    `json:"id"`
	AccountID   string    `json:"accountId"`
	Type        string    `json:"type"`
	Category    string    `json:"category"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Date        time.Time `json:"date"`
	Description string    `json:"description,omitempty"`
	Metadata    string    `json:"metadata,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Account represents a user's financial account
type Account struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Currency  string    `json:"currency"`
	Balance   float64   `json:"balance"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// User represents a system user
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Entity represents a user's finance data context (personal, business A, etc.)
type Entity struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// RequestContext holds request-scoped data
type RequestContext struct {
	UserID   string
	EntityID string
	Role     string
}
