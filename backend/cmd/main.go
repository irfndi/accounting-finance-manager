package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/irfndi/fin-in-flow/backend/api"
	"github.com/irfndi/fin-in-flow/backend/middleware"
	"github.com/irfndi/fin-in-flow/backend/migrations"
	"net/http"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	db, err := initDatabase()
	if err != nil {
		slog.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	slog.Info("Database initialized successfully")

	if err := runMigrations(db); err != nil {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}

	slog.Info("Migrations completed")

	mux := api.NewRouter()

	mux.HandleFunc("/", api.IndexHandler)
	mux.HandleFunc("/health", api.HealthHandler)
	mux.HandleFunc("/api", api.APIHandler)
	mux.HandleFunc("/api/transactions", api.TransactionsHandler)
	mux.HandleFunc("/api/accounts", api.AccountsHandler)
	mux.HandleFunc("/api/entities", api.EntitiesHandler)

	middlewareChain := middleware.CORS(
		middleware.Logging(
			middleware.Recovery(nil),
		),
	)

	fmt.Printf("Starting Finance Manager backend on port %s\n", port)

	if err := http.ListenAndServe(":"+port, middlewareChain); err != nil {
		fmt.Printf("Server failed: %v\n", err)
		os.Exit(1)
	}
}

func initDatabase() (*sql.DB, error) {
	dbID := os.Getenv("D1_DATABASE_ID")
	if dbID == "" {
		dbID = "11bc7825-db1f-4ab4-8009-15254c808ba5"
	}

	dsn := fmt.Sprintf("d1:%s", dbID)
	db, err := sql.Open("cloudflare-d1", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open D1 database: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	ctx := context.Background()
	if err := db.PingContext(ctx); err != nil {
		slog.Warn("Database ping failed, may work in runtime", "error", err)
	}

	return db, nil
}

func runMigrations(db *sql.DB) error {
	migrator := migrations.NewMigrator(db)

	migrationsDir := filepath.Join("..", "migrations")
	migrationFiles, err := migrations.LoadMigrations(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	if len(migrationFiles) == 0 {
		slog.Info("No migrations found")
		return nil
	}

	return migrator.Run(migrationFiles)
}
