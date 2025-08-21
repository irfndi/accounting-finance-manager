package routes

import (
	"github.com/gin-gonic/gin"

	"finance-manager/internal/handlers"
	"finance-manager/internal/middleware"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, userHandler *handlers.UserHandler, accountHandler *handlers.AccountHandler, transactionHandler *handlers.TransactionHandler) {
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "finance-manager",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Public authentication routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
			auth.POST("/logout", userHandler.Logout)
		}

		// Protected user routes
		users := v1.Group("/users")
		users.Use(middleware.AuthRequired())
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
			users.DELETE("/account", userHandler.DeleteAccount)
			users.POST("/change-password", userHandler.ChangePassword)

			// Admin only route for getting user by ID
			users.GET("/:id", userHandler.GetUserByID)
		}

		// Protected account routes
		accounts := v1.Group("/accounts")
		accounts.Use(middleware.AuthRequired())
		{
			accounts.POST("", accountHandler.CreateAccount)
			accounts.GET("", accountHandler.GetAccounts)
			accounts.GET("/summary", accountHandler.GetAccountSummary)
			accounts.POST("/transfer", accountHandler.TransferFunds)

			// Account-specific routes
			accounts.GET("/:id", accountHandler.GetAccount)
			accounts.PUT("/:id", accountHandler.UpdateAccount)
			accounts.DELETE("/:id", accountHandler.DeleteAccount)
			accounts.PATCH("/:id/balance", accountHandler.UpdateAccountBalance)
		}

		// Protected transaction routes
		transactions := v1.Group("/transactions")
		transactions.Use(middleware.AuthRequired())
		{
			transactions.POST("", transactionHandler.CreateTransaction)
			transactions.GET("", transactionHandler.GetTransactions)
			transactions.GET("/summary", transactionHandler.GetTransactionSummary)

			// Transaction-specific routes
			transactions.GET("/:id", transactionHandler.GetTransaction)
			transactions.PUT("/:id", transactionHandler.UpdateTransaction)
			transactions.DELETE("/:id", transactionHandler.DeleteTransaction)
		}
	}

	// API documentation routes (if using Swagger)
	// r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
