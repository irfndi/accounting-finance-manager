package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// Recovery returns a middleware that recovers from panics
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		// Log the panic with stack trace
		log.Printf("PANIC: %v\n%s", recovered, debug.Stack())

		// Get request ID if available
		requestID := "unknown"
		if id, exists := c.Get("request_id"); exists {
			if reqID, ok := id.(string); ok {
				requestID = reqID
			}
		}

		// Return error response
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":      "Internal server error",
			"message":    "An unexpected error occurred. Please try again later.",
			"request_id": requestID,
		})
	})
}

// CustomRecovery returns a custom recovery middleware with additional logging
func CustomRecovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				// Get additional context information
				userID := "anonymous"
				if id, exists := c.Get("user_id"); exists {
					if userIDUint, ok := id.(uint); ok {
						userID = fmt.Sprintf("%d", userIDUint)
					}
				}

				requestID := "unknown"
				if id, exists := c.Get("request_id"); exists {
					if reqID, ok := id.(string); ok {
						requestID = reqID
					}
				}

				// Log detailed panic information
				log.Printf("PANIC RECOVERED:\n"+
					"Request ID: %s\n"+
					"User ID: %s\n"+
					"Method: %s\n"+
					"Path: %s\n"+
					"Client IP: %s\n"+
					"User Agent: %s\n"+
					"Panic: %v\n"+
					"Stack Trace:\n%s",
					requestID,
					userID,
					c.Request.Method,
					c.Request.URL.Path,
					c.ClientIP(),
					c.Request.UserAgent(),
					recovered,
					debug.Stack(),
				)

				// Return structured error response
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":      "Internal server error",
					"message":    "An unexpected error occurred. Please try again later.",
					"request_id": requestID,
					"timestamp":  fmt.Sprintf("%d", c.Request.Context().Value("timestamp")),
				})

				// Abort the request
				c.Abort()
			}
		}()

		c.Next()
	}
}
