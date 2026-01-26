package main

import (
	"fmt"
	"github.com/irfndi/fin-in-flow/backend/api"
	"github.com/irfndi/fin-in-flow/backend/middleware"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := api.NewRouter()

	mux.HandleFunc("/", api.IndexHandler)
	mux.HandleFunc("/health", api.HealthHandler)
	mux.HandleFunc("/api", api.APIHandler)

	middleware := middleware.CORS(
		middleware.Logging(
			middleware.Recovery(nil),
		),
	)

	fmt.Printf("Starting Finance Manager backend on port %s\n", port)

	if err := http.ListenAndServe(":"+port, middleware); err != nil {
		fmt.Printf("Server failed: %v\n", err)
		os.Exit(1)
	}
}
