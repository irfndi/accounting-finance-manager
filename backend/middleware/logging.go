package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Log the incoming request
		slog.Info("Request received",
			"method", r.Method,
			"path", r.URL.Path,
			"user_agent", r.UserAgent(),
		)

		// Use custom response writer to capture status code
		lrw := &loggingResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(lrw, r)

		// Log completion with duration
		duration := time.Since(start)
		slog.Info("Request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", lrw.statusCode,
			"duration", duration.String(),
		)

		w.Header().Set("X-Response-Time", duration.String())
	})
}

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(statusCode int) {
	lrw.statusCode = statusCode
	lrw.ResponseWriter.WriteHeader(statusCode)
}
