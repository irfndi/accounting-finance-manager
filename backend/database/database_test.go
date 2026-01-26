package database

import (
	"context"
	"testing"

	"github.com/irfndi/fin-in-flow/backend/internal/database"
)

func TestDBConnection(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()
	if err := db.PingContext(ctx); err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
}

func TestSchemaTablesExist(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()

	tables := []string{
		"users", "roles", "user_roles", "entities",
		"accounts", "transactions", "journal_entries",
		"documents", "vector_embeddings",
	}

	for _, table := range tables {
		var exists int
		err := db.QueryRowContext(ctx, "SELECT name FROM sqlite_master WHERE type='table' AND name=?", table).Scan(&exists)
		if err != nil {
			t.Errorf("Failed to check table %s: %v", table, err)
		}
		if exists == 0 {
			t.Errorf("Table %s does not exist", table)
		}
	}
}

func TestInsertTransaction(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()

	_, err := db.ExecContext(ctx, "INSERT INTO transactions (id, entity_id, account_id, type, category, amount, currency, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
		"txn-test-001", "entity-test-001", "acct-test-001", "income", "salary", 5000.00, "USD", "2024-01-01 00:00:00")
	if err != nil {
		t.Fatalf("Failed to insert test transaction: %v", err)
	}
}

func TestQueryTransaction(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()

	_, err := db.ExecContext(ctx, "INSERT INTO transactions (id, entity_id, account_id, type, category, amount, currency, date) VALUES (?, ?, ?, ?, ?, ?)",
		"txn-test-002", "entity-test-001", "acct-test-001", "expense", "groceries", 250.00, "USD", "2024-01-02 00:00:00")
	if err != nil {
		t.Fatalf("Failed to insert test transaction: %v", err)
	}

	var amount float64
	err = db.QueryRowContext(ctx, "SELECT amount FROM transactions WHERE id=?", "txn-test-002").Scan(&amount)
	if err != nil {
		t.Fatalf("Failed to query transaction: %v", err)
	}

	if amount != 250.00 {
		t.Errorf("Expected amount 250.00, got %f", amount)
	}
}

func TestForeignKeyCascade(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()

	_, err := db.ExecContext(ctx, "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
		"user-cascade", "cascade@example.com", "User to delete", "hash123")
	if err != nil {
		t.Fatalf("Failed to insert user: %v", err)
	}

	_, err = db.ExecContext(ctx, "INSERT INTO entities (id, user_id, name, type, currency) VALUES (?, ?, ?, ?, ?)",
		"entity-cascade", "user-cascade", "Entity to cascade", "personal", "USD")
	if err != nil {
		t.Fatalf("Failed to insert entity: %v", err)
	}

	var count int
	err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM entities WHERE user_id=?", "user-cascade").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to count entities: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 entity for user, got %d", count)
	}

	_, err = db.ExecContext(ctx, "DELETE FROM users WHERE id=?", "user-cascade")
	if err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}

	err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM entities WHERE user_id=?", "user-cascade").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to count entities after user deletion: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 entities after user deletion (CASCADE constraint failed), got %d", count)
	}
}

func TestConnectionPoolLimit(t *testing.T) {
	config := internal.D1Config{
		DatabaseID:     ":memory:",
		MaxConnections: 5,
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	if db.MaxOpenConns() != 5 {
		t.Errorf("Expected MaxOpenConns 5, got %d", db.MaxOpenConns())
	}

	if db.MaxIdleConns() != 2 {
		t.Errorf("Expected MaxIdleConns 2, got %d", db.MaxIdleConns())
	}
}

func TestTransactionCRUD(t *testing.T) {
	config := internal.D1Config{
		DatabaseID: ":memory:",
	}

	db := internal.NewD1Client(config)
	defer db.Close()

	ctx := context.Background()

	_, err := db.ExecContext(ctx, "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
		"user-crud", "crud@example.com", "Test User", "hash123")
	if err != nil {
		t.Fatalf("Failed to insert user: %v", err)
	}

	var exists bool
	err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE id=?", "user-crud").Scan(&exists)
	if err != nil {
		t.Fatalf("Failed to query user: %v", err)
	}

	if exists == 0 {
		t.Errorf("User was not inserted", "user-crud")
	}
}
