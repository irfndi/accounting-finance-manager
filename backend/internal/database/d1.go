package database

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"sync"
)

// D1Config holds configuration for D1 database
type D1Config struct {
	DatabaseID         string
	MigrationsDir      string
	MaxConnections     int
	EnableReadReplicas bool
}

// D1Client represents a D1 database client
type D1Client struct {
	db     *sql.DB
	config *D1Config
	mu     sync.RWMutex
}

// NewD1Client creates a new D1 database client
func NewD1Client(config *D1Config) (*D1Client, error) {
	dsn := fmt.Sprintf("d1:%s", config.DatabaseID)

	db, err := sql.Open("cloudflare-d1", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open D1 database: %w", err)
	}

	if config.MaxConnections <= 0 {
		config.MaxConnections = 10
	}

	db.SetMaxOpenConns(config.MaxConnections)
	db.SetMaxIdleConns(config.MaxConnections / 2)

	ctx := context.Background()
	if err := db.PingContext(ctx); err != nil {
		slog.Warn("Initial ping failed, may work in runtime", "error", err)
	}

	slog.Info("D1 database initialized",
		"database_id", config.DatabaseID,
		"max_connections", config.MaxConnections,
	)

	return &D1Client{
		db:     db,
		config: config,
	}, nil
}

// GetDB returns underlying *sql.DB for direct queries
func (d *D1Client) GetDB() *sql.DB {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db
}

// Query performs a read query
func (d *D1Client) Query(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryContext(ctx, query, args...)
}

// QueryRow performs a read query for a single row
func (d *D1Client) QueryRow(ctx context.Context, query string, args ...interface{}) *sql.Row {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryRowContext(ctx, query, args...)
}

// Exec performs a write operation
func (d *D1Client) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.db.ExecContext(ctx, query, args...)
}

// Begin starts a new transaction
func (d *D1Client) Begin(ctx context.Context) (*sql.Tx, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.db.BeginTx(ctx, nil)
}

// Close closes the database connection
func (d *D1Client) Close() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.db.Close()
}
