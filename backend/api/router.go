package api

import "net/http"

// Router handles HTTP routing for the API
func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", indexHandler)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api", apiHandler)
	return mux
}

// Route handler functions
func indexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Finance Manager API - Go 1.25 Backend","status":"healthy"}`))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","service":"finance-container"}`))
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"API endpoints will be implemented here"}`))
}
