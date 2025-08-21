package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"finance-manager/internal/config"
	"finance-manager/internal/middleware"
	"finance-manager/pkg/telemetry"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or could not be loaded: %v", err)
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize OpenTelemetry
	telemetryConfig := telemetry.LoadConfigFromEnv()
	tel, err := telemetry.NewTelemetry(telemetryConfig)
	if err != nil {
		log.Fatalf("Failed to initialize telemetry: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := tel.Shutdown(ctx); err != nil {
			log.Printf("Error shutting down telemetry: %v", err)
		}
	}()
	log.Println("OpenTelemetry initialized")

	// TODO: Initialize database connection
	// if err := database.InitDatabase(cfg.Database.URL()); err != nil {
	//	log.Fatalf("Failed to connect to database: %v", err)
	// }
	// defer database.CloseDatabase()

	// TODO: Test database connection
	// if err := database.HealthCheck(); err != nil {
	//	log.Fatalf("Failed to ping database: %v", err)
	// }
	// log.Println("Database connection established")

	// TODO: Run database migrations
	// if err := database.AutoMigrate(); err != nil {
	//	log.Fatalf("Failed to run database migrations: %v", err)
	// }
	// log.Println("Database migrations completed")
	log.Println("Database initialization skipped for testing")

	// TODO: Initialize Redis connection
	// redisConfig := redis.Config{
	//	Host:     cfg.Redis.Host,
	//	Port:     cfg.Redis.Port,
	//	Password: cfg.Redis.Password,
	//	DB:       cfg.Redis.DB,
	// }
	// redisClient, err := redis.NewConnection(redisConfig)
	// if err != nil {
	//	log.Fatalf("Failed to connect to Redis: %v", err)
	// }
	// defer redisClient.Close()

	// TODO: Test Redis connection
	// ctx := context.Background()
	// if err := redisClient.Health(ctx); err != nil {
	//	log.Fatalf("Failed to ping Redis: %v", err)
	// }
	// log.Println("Redis connection established")
	log.Println("Redis initialization skipped for testing")

	// Set Gin mode based on environment
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize Gin router
	router := gin.New()

	// Initialize telemetry metrics
	appMetrics, err := telemetry.NewApplicationMetrics()
	if err != nil {
		log.Fatalf("Failed to initialize application metrics: %v", err)
	}

	// Initialize HTTP metrics
	httpMetrics, err := telemetry.NewHTTPMetrics()
	if err != nil {
		log.Fatalf("Failed to initialize HTTP metrics: %v", err)
	}

	// Initialize global logger
	logLevel, logFormat := telemetry.LoadLoggerConfigFromEnv()
	telemetry.InitGlobalLogger(logLevel, logFormat)

	// Initialize global metrics
	if err := telemetry.InitGlobalMetrics(); err != nil {
		log.Fatalf("Failed to initialize global metrics: %v", err)
	}

	// Add middleware
	router.Use(middleware.Logger())
	router.Use(gin.Recovery())
	router.Use(telemetry.GinMiddleware(telemetryConfig.ServiceName)) // OpenTelemetry tracing
	router.Use(telemetry.GinMetricsMiddleware(httpMetrics))          // OpenTelemetry metrics
	router.Use(middleware.CORS(middleware.CORSConfig{
		AllowedOrigins: cfg.CORS.AllowedOrigins,
		AllowedMethods: cfg.CORS.AllowedMethods,
		AllowedHeaders: cfg.CORS.AllowedHeaders,
	}))
	router.Use(middleware.RequestID())
	router.Use(middleware.RateLimit()) // Default rate limiting

	// TODO: Get database connection
	// db := database.GetDB()

	// TODO: Initialize repositories
	// userRepo := repositories.NewUserRepository(db) // Not used yet
	// sessionRepo := repositories.NewSessionRepository(db) // Not used yet
	// accountRepo := repositories.NewAccountRepository(db)
	// transactionRepo := repositories.NewTransactionRepository(db)

	// TODO: JWT middleware configuration
	// jwtConfig := middleware.JWTConfig{
	//	Secret:     cfg.JWT.Secret,
	//	Expiration: cfg.JWT.Expiration,
	// }

	// TODO: Initialize services
	// accountService := services.NewAccountService(accountRepo, transactionRepo)
	// transactionService := services.NewTransactionService(transactionRepo, accountRepo)
	// userService := services.NewUserService(userRepo, sessionRepo, cfg.JWT.Secret, cfg.JWT.Expiration) // Not used yet

	// TODO: Initialize handlers
	// authHandler := handlers.NewAuthHandler(db, redisClient, jwtConfig)
	// accountHandler := handlers.NewAccountHandler(accountService)
	// transactionHandler := handlers.NewTransactionHandler(transactionService)
	// categoryHandler := handlers.NewCategoryHandler(db)
	// reportsHandler := handlers.NewReportsHandler(db)
	log.Println("Handlers initialization skipped for testing")

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
		})
	})

	// TODO: API routes
	v1 := router.Group("/api/v1")
	{
		// TODO: Auth routes
		// auth := v1.Group("/auth")
		// {
		//	auth.POST("/register", authHandler.Register)
		//	auth.POST("/login", authHandler.Login)
		//	auth.POST("/logout", middleware.JWTAuth(jwtConfig), authHandler.Logout)
		//	auth.POST("/refresh", authHandler.RefreshToken)
		//	auth.GET("/me", middleware.JWTAuth(jwtConfig), authHandler.GetProfile)
		// }

		// TODO: Protected routes
		// protected := v1.Group("/")
		// protected.Use(middleware.JWTAuth(jwtConfig))
		// {
		//	// Account routes
		//	accounts := protected.Group("/accounts")
		//	{
		//		accounts.GET("/", accountHandler.GetAccounts)
		//		accounts.POST("/", accountHandler.CreateAccount)
		//		accounts.GET("/:id", accountHandler.GetAccount)
		//		accounts.PUT("/:id", accountHandler.UpdateAccount)
		//		accounts.DELETE("/:id", accountHandler.DeleteAccount)
		//	}

		//	// Transaction routes
		//	transactions := protected.Group("/transactions")
		//	{
		//		transactions.GET("/", transactionHandler.GetTransactions)
		//		transactions.POST("/", transactionHandler.CreateTransaction)
		//		transactions.GET("/:id", transactionHandler.GetTransaction)
		//		transactions.PUT("/:id", transactionHandler.UpdateTransaction)
		//		transactions.DELETE("/:id", transactionHandler.DeleteTransaction)
		//	}

		//	// Category routes
		//	categories := protected.Group("/categories")
		//	{
		//		categories.GET("/", categoryHandler.GetCategories)
		//		categories.POST("/", categoryHandler.CreateCategory)
		//		categories.GET("/:id", categoryHandler.GetCategory)
		//		categories.PUT("/:id", categoryHandler.UpdateCategory)
		//		categories.DELETE("/:id", categoryHandler.DeleteCategory)
		//	}

		//	// Reports routes
		//	reports := protected.Group("/reports")
		//	{
		//		reports.GET("/summary", reportsHandler.GetSummary)
		//		reports.GET("/spending", reportsHandler.GetSpendingReport)
		//		reports.GET("/income", reportsHandler.GetIncomeReport)
		//		reports.GET("/balance", reportsHandler.GetBalanceReport)
		//	}
		// }
		v1.GET("/test", func(c *gin.Context) {
			// Record a test metric to demonstrate telemetry is working
			appMetrics.RecordUserLogin(c.Request.Context(), "test-user", "api")
			c.JSON(200, gin.H{"message": "Server is running!", "telemetry": "enabled"})
		})
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %d", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests a deadline for completion
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Println("Server exited gracefully")
	}
}
