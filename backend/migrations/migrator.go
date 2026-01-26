package migrations

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Migration represents a database migration
type Migration struct {
	Version string
	Up      string
	Down    string
}

// Migrator handles database migrations
type Migrator struct {
	db *sql.DB
}

// NewMigrator creates a new migrator instance
func NewMigrator(db *sql.DB) *Migrator {
	return &Migrator{db: db}
}

// Run executes all pending migrations
func (m *Migrator) Run(migrations []Migration) error {
	for _, migration := range migrations {
		if err := m.applyMigration(migration); err != nil {
			return fmt.Errorf("failed to apply migration %s: %w", migration.Version, err)
		}
		slog.Info("Applied migration", "version", migration.Version)
	}
	return nil
}

// applyMigration applies a single migration
func (m *Migrator) applyMigration(migration Migration) error {
	tx, err := m.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if err := m.ensureMigrationTable(tx); err != nil {
		return fmt.Errorf("failed to ensure migrations table: %w", err)
	}

	applied, err := m.isMigrationApplied(tx, migration.Version)
	if err != nil {
		return fmt.Errorf("failed to check migration status: %w", err)
	}

	if applied {
		slog.Info("Migration already applied", "version", migration.Version)
		return nil
	}

	if _, err := tx.Exec(migration.Up); err != nil {
		return fmt.Errorf("failed to execute migration up: %w", err)
	}

	if _, err := tx.Exec(
		"INSERT INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))",
		migration.Version,
	); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit migration: %w", err)
	}

	return nil
}

// ensureMigrationTable creates the schema_migrations table
func (m *Migrator) ensureMigrationTable(tx *sql.Tx) error {
	_, err := tx.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

// isMigrationApplied checks if a migration version exists
func (m *Migrator) isMigrationApplied(tx *sql.Tx, version string) (bool, error) {
	var count int
	err := tx.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to query migration status: %w", err)
	}
	return count > 0, nil
}

// LoadMigrations reads migration files from directory
func LoadMigrations(dir string) ([]Migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []Migration
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		filePath := filepath.Join(dir, entry.Name())
		content, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", entry.Name(), err)
		}

		version := strings.TrimSuffix(entry.Name(), ".sql")
		migrations = append(migrations, Migration{
			Version: version,
			Up:      string(content),
		})
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	return migrations, nil
}
