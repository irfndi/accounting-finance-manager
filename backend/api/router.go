package api

import "net/http"

// NewRouter creates a new HTTP ServeMux with all routes registered
func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", IndexHandler)
	mux.HandleFunc("/health", HealthHandler)
	mux.HandleFunc("/api", APIHandler)
	return mux
}

// IndexHandler serves the root endpoint
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Finance Manager API - Go 1.25 Backend","status":"healthy"}`))
}

// HealthHandler serves the health check endpoint
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","service":"finance-container"}`))
}

// APIHandler serves the main API endpoint
func APIHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"API endpoints will be implemented here"}`))
}
