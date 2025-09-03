# Finance Manager Development Makefile
# =================================
# 
# This Makefile provides shortcuts for common development tasks
# Run 'make help' to see all available commands

.PHONY: help install clean dev build lint test e2e docker/up docker/down docker/logs deploy/vps

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)Finance Manager Development Commands$(RESET)"
	@echo "====================================="
	@echo ""
	@grep -E '^[a-zA-Z_/%-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  make install     # Set up the project"
	@echo "  make dev         # Start development server"
	@echo "  make test        # Run all tests"
	@echo "  make docker/up   # Start Docker services"

# =============================================================================
# SETUP & MAINTENANCE
# =============================================================================

install: ## Install all dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	bun install && cd apps/web && bun install
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

clean: ## Clean all build artifacts and node_modules
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	bun run clean:all
	@echo "$(GREEN)✓ Clean complete$(RESET)"

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: ## Start full development server (frontend + backend)
	@echo "$(CYAN)Starting development server...$(RESET)"
	@echo "  - Astro dev server (port 3000)"
	@echo "  - Go API server (port 8080)"
	@echo ""
	bun run dev

dev/web: ## Start only the web development server
	@echo "$(CYAN)Starting Astro development server...$(RESET)"
	cd apps/web && bun run dev

dev/api: ## Start only the API development server
	@echo "$(CYAN)Starting Go API development server...$(RESET)"
	cd backend && go run cmd/main.go

# =============================================================================
# LINTING & FORMATTING
# =============================================================================

lint: ## Run linting on all packages
	@echo "$(CYAN)Running linter...$(RESET)"
	bun run lint
	@echo "$(GREEN)✓ Linting complete$(RESET)"

lint/fix: ## Fix linting issues automatically
	@echo "$(CYAN)Fixing linting issues...$(RESET)"
	bun run lint:fix
	@echo "$(GREEN)✓ Linting fixes applied$(RESET)"

format: ## Format code with prettier
	@echo "$(CYAN)Formatting code...$(RESET)"
	bun run format
	@echo "$(GREEN)✓ Code formatting complete$(RESET)"

# =============================================================================
# TESTING
# =============================================================================

test: ## Run all tests
	@echo "$(CYAN)Running all tests...$(RESET)"
	bun run test:all
	@echo "$(GREEN)✓ All tests complete$(RESET)"

test/web: ## Run web application tests
	@echo "$(CYAN)Running web application tests...$(RESET)"
	bun run test:web
	@echo "$(GREEN)✓ Web tests complete$(RESET)"

test/api: ## Run API tests
	@echo "$(CYAN)Running API tests...$(RESET)"
	bun run test:api
	@echo "$(GREEN)✓ API tests complete$(RESET)"

test/e2e: ## Run end-to-end tests
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	bun run test:e2e
	@echo "$(GREEN)✓ E2E tests complete$(RESET)"

test/coverage: ## Run tests with coverage
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	bun run test:coverage
	@echo "$(GREEN)✓ Tests with coverage complete$(RESET)"

# =============================================================================
# BUILDING
# =============================================================================

build: ## Build the application
	@echo "$(CYAN)Building application...$(RESET)"
	bun run build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build/web: ## Build only the web application
	@echo "$(CYAN)Building web application...$(RESET)"
	bun run build
	@echo "$(GREEN)✓ Web build complete$(RESET)"

build/api: ## Build only the API
	@echo "$(CYAN)Building API...$(RESET)"
	bun run build:api
	@echo "$(GREEN)✓ API build complete$(RESET)"

# =============================================================================
# DOCKER OPERATIONS
# =============================================================================

docker/up: ## Start all Docker services
	@echo "$(CYAN)Starting Docker services...$(RESET)"
	cd infrastructure && docker-compose up -d
	@echo "$(GREEN)✓ Docker services started$(RESET)"

docker/down: ## Stop all Docker services
	@echo "$(CYAN)Stopping Docker services...$(RESET)"
	cd infrastructure && docker-compose down
	@echo "$(GREEN)✓ Docker services stopped$(RESET)"

docker/build: ## Build Docker images
	@echo "$(CYAN)Building Docker images...$(RESET)"
	bun run docker:build
	@echo "$(GREEN)✓ Docker images built$(RESET)"

docker/logs: ## Show Docker service logs
	@echo "$(CYAN)Showing Docker logs...$(RESET)"
	bun run docker:logs

docker/clean: ## Clean Docker containers and images
	@echo "$(CYAN)Cleaning Docker resources...$(RESET)"
	cd infrastructure && docker-compose down -v --rmi all
	@echo "$(GREEN)✓ Docker cleanup complete$(RESET)"

# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

db/migrate: ## Run database migrations
	@echo "$(CYAN)Running database migrations...$(RESET)"
	bun run db:migrate
	@echo "$(GREEN)✓ Database migrations complete$(RESET)"

db/generate: ## Generate database schema
	@echo "$(CYAN)Generating database schema...$(RESET)"
	bun run db:generate
	@echo "$(GREEN)✓ Schema generation complete$(RESET)"

db/studio: ## Open database studio
	@echo "$(CYAN)Opening database studio...$(RESET)"
	bun run db:studio

# =============================================================================
# DEPLOYMENT
# =============================================================================

deploy/vps: ## Deploy to VPS
	@echo "$(CYAN)Deploying to VPS...$(RESET)"
	bun run deploy:vps
	@echo "$(GREEN)✓ VPS deployment complete$(RESET)"

deploy/prepare: ## Prepare deployment package
	@echo "$(CYAN)Preparing deployment package...$(RESET)"
	bun run docker:build
	@echo "$(GREEN)✓ Deployment package prepared$(RESET)"

# =============================================================================
# QUALITY ASSURANCE
# =============================================================================

check: ## Run all checks (lint + test + build)
	@echo "$(CYAN)Running all checks...$(RESET)"
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build
	@echo "$(GREEN)✓ All checks passed$(RESET)"

ci: ## Run CI pipeline
	@echo "$(CYAN)Running CI pipeline...$(RESET)"
	$(MAKE) lint
	$(MAKE) test/coverage
	$(MAKE) build
	@echo "$(GREEN)✅ CI pipeline completed$(RESET)"

# =============================================================================
# UTILITIES
# =============================================================================

status: ## Show project status
	@echo "$(CYAN)Finance Manager - Project Status$(RESET)"
	@echo "=================================="
	@echo "$(GREEN)✓ Frontend:$(RESET) Astro + React + Bun"
	@echo "$(GREEN)✓ Backend:$(RESET) Go API"
	@echo "$(GREEN)✓ Database:$(RESET) PostgreSQL"
	@echo "$(GREEN)✓ Cache:$(RESET) Redis"
	@echo "$(GREEN)✓ Deployment:$(RESET) Docker + VPS"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(RESET)"
	@echo "  make dev         # Start development servers"
	@echo "  make docker/up   # Start Docker services"
	@echo "  make test        # Run tests"
	@echo ""
	@echo "$(YELLOW)Production Commands:$(RESET)"
	@echo "  make build       # Build for production"
	@echo "  make deploy/vps  # Deploy to VPS"

fresh: ## Fresh install (clean + install)
	@echo "$(CYAN)Fresh installation...$(RESET)"
	$(MAKE) clean
	$(MAKE) install
	@echo "$(GREEN)✓ Fresh installation complete$(RESET)"

# =============================================================================
# EMERGENCY COMMANDS
# =============================================================================

emergency/reset: ## Emergency: Reset entire development environment
	@echo "$(RED)🚨 EMERGENCY: Resetting development environment$(RESET)"
	@echo "$(YELLOW)This will remove all containers, volumes, and node_modules$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	$(MAKE) clean
	$(MAKE) docker/clean
	@echo "$(GREEN)✓ Emergency reset complete$(RESET)"

emergency/backup: ## Emergency: Backup database
	@echo "$(RED)🚨 EMERGENCY: Creating database backup$(RESET)"
	cd infrastructure && docker-compose exec postgres pg_dump -U finance_user finance_manager > backup_$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backup created$(RESET)"