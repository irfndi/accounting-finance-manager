package middleware

import (
	"net/http"
	"strings"
)

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret    string
	ExcludePaths []string
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(config *AuthConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for _, path := range config.ExcludePaths {
				if strings.HasPrefix(r.URL.Path, path) {
					next.ServeHTTP(w, r)
					return
				}
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")

			if token == "" {
				http.Error(w, "Token required", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
