package testing

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/irfndi/fin-in-flow/backend/api"
)

// SetupTestRouter creates a test router with all routes
func SetupTestRouter() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/", api.IndexHandler)
	mux.HandleFunc("/health", api.HealthHandler)
	mux.HandleFunc("/api", api.APIHandler)
	mux.HandleFunc("/api/transactions", api.TransactionsHandler)
	mux.HandleFunc("/api/accounts", api.AccountsHandler)
	mux.HandleFunc("/api/entities", api.EntitiesHandler)

	return mux
}

// CleanupDB cleans up test database
func CleanupDB(t *testing.T, dbPath string) {
	if err := os.Remove(dbPath); err != nil {
		t.Logf("Failed to remove test database: %v", err)
	}
}

// CreateTestDB creates a test database
func CreateTestDB(t *testing.T, dbName string) string {
	dir := t.TempDir()
	return filepath.Join(dir, dbName+".db")
}
