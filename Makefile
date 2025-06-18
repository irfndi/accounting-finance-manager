# Finance Manager Development Makefile
# =================================
# 
# This Makefile provides shortcuts for common development tasks
# Run 'make help' to see all available commands

.PHONY: help install clean dev build lint test unit e2e prod/build prod/migrate publish

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
	@echo "  make prod/build  # Build for production"

# =============================================================================
# SETUP & MAINTENANCE
# =============================================================================

install: ## Install all dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	pnpm install
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

clean: ## Clean all build artifacts and node_modules
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	pnpm clean
	@echo "$(GREEN)✓ Clean complete$(RESET)"

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: ## Start development server with hot reload
	@echo "$(CYAN)Starting development server...$(RESET)"
	@echo "$(YELLOW)This will start:$(RESET)"
	@echo "  - Astro dev server (apps/web)"
	@echo "  - Worker dev server (miniflare)"
	@echo "  - TypeScript compilation in watch mode"
	@echo ""
	pnpm -r --parallel dev

dev/web: ## Start only the web development server
	@echo "$(CYAN)Starting Astro development server...$(RESET)"
	cd apps/web && pnpm dev

dev/worker: ## Start only the worker development server
	@echo "$(CYAN)Starting Worker development server...$(RESET)"
	cd worker && pnpm dev

dev/packages: ## Build packages in watch mode
	@echo "$(CYAN)Building packages in watch mode...$(RESET)"
	pnpm -r --parallel --filter "./packages/*" dev

# =============================================================================
# LINTING & FORMATTING
# =============================================================================

lint: ## Run linting on all packages
	@echo "$(CYAN)Running linter...$(RESET)"
	pnpm oxlint .
	@echo "$(GREEN)✓ Linting complete$(RESET)"

lint/fix: ## Fix linting issues automatically
	@echo "$(CYAN)Fixing linting issues...$(RESET)"
	pnpm oxlint --fix .
	@echo "$(GREEN)✓ Linting fixes applied$(RESET)"

# =============================================================================
# TESTING
# =============================================================================

test: unit ## Run all tests (alias for unit tests)

unit: ## Run unit tests
	@echo "$(CYAN)Running unit tests...$(RESET)"
	pnpm -r test
	@echo "$(GREEN)✓ Unit tests complete$(RESET)"

unit/coverage: ## Run unit tests with coverage
	@echo "$(CYAN)Running unit tests with coverage...$(RESET)"
	pnpm -r test:coverage
	@echo "$(GREEN)✓ Unit tests with coverage complete$(RESET)"

e2e: ## Run end-to-end tests
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	@echo "$(YELLOW)Building project first...$(RESET)"
	$(MAKE) build
	pnpm playwright test
	@echo "$(GREEN)✓ E2E tests complete$(RESET)"

e2e/headed: ## Run E2E tests in headed mode
	@echo "$(CYAN)Running E2E tests in headed mode...$(RESET)"
	$(MAKE) build
	pnpm playwright test --headed
	@echo "$(GREEN)✓ E2E tests complete$(RESET)"

test/miniflare: ## Run integration tests with Miniflare
	@echo "$(CYAN)Running integration tests with Miniflare...$(RESET)"
	cd worker && pnpm test
	@echo "$(GREEN)✓ Integration tests complete$(RESET)"

# =============================================================================
# BUILDING
# =============================================================================

build: ## Build all packages for development
	@echo "$(CYAN)Building packages...$(RESET)"
	pnpm -r build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build/web: ## Build only the web application
	@echo "$(CYAN)Building web application...$(RESET)"
	cd apps/web && pnpm build
	@echo "$(GREEN)✓ Web build complete$(RESET)"

build/packages: ## Build only the packages
	@echo "$(CYAN)Building packages...$(RESET)"
	pnpm -r --filter "./packages/*" build
	@echo "$(GREEN)✓ Package builds complete$(RESET)"

build/worker: ## Build only the worker
	@echo "$(CYAN)Building worker...$(RESET)"
	cd worker && pnpm build
	@echo "$(GREEN)✓ Worker build complete$(RESET)"

# =============================================================================
# PRODUCTION
# =============================================================================

prod/build: ## Build everything for production
	@echo "$(CYAN)Building for production...$(RESET)"
	@echo "$(YELLOW)1. Building packages...$(RESET)"
	$(MAKE) build/packages
	@echo "$(YELLOW)2. Building web application...$(RESET)"
	$(MAKE) build/web
	@echo "$(YELLOW)3. Building worker...$(RESET)"
	$(MAKE) build/worker
	@echo "$(GREEN)✓ Production build complete$(RESET)"

prod/migrate: ## Run database migrations in production
	@echo "$(CYAN)Running database migrations...$(RESET)"
	cd packages/db && pnpm migrate
	@echo "$(GREEN)✓ Database migrations complete$(RESET)"

prod/deploy: ## Deploy to production (requires wrangler auth)
	@echo "$(CYAN)Deploying to production...$(RESET)"
	@echo "$(YELLOW)This will:$(RESET)"
	@echo "  - Build the project"
	@echo "  - Run migrations"
	@echo "  - Deploy to Cloudflare Workers"
	@echo ""
	$(MAKE) prod/build
	$(MAKE) prod/migrate
	cd worker && pnpm deploy
	@echo "$(GREEN)✓ Deployment complete$(RESET)"

publish: prod/deploy ## Alias for prod/deploy

# =============================================================================
# DATABASE
# =============================================================================

db/generate: ## Generate database schema files
	@echo "$(CYAN)Generating database schema...$(RESET)"
	cd packages/db && pnpm generate
	@echo "$(GREEN)✓ Schema generation complete$(RESET)"

db/migrate: ## Run database migrations locally
	@echo "$(CYAN)Running local database migrations...$(RESET)"
	cd packages/db && pnpm migrate
	@echo "$(GREEN)✓ Local migrations complete$(RESET)"

db/studio: ## Open Drizzle Studio
	@echo "$(CYAN)Opening Drizzle Studio...$(RESET)"
	cd packages/db && pnpm studio

# =============================================================================
# UTILITIES
# =============================================================================

check: ## Run all checks (lint + test + build)
	@echo "$(CYAN)Running all checks...$(RESET)"
	$(MAKE) lint
	$(MAKE) unit
	$(MAKE) build
	@echo "$(GREEN)✓ All checks passed$(RESET)"

fresh: ## Fresh install (clean + install)
	@echo "$(CYAN)Fresh installation...$(RESET)"
	$(MAKE) clean
	$(MAKE) install
	@echo "$(GREEN)✓ Fresh installation complete$(RESET)"

status: ## Show project status
	@echo "$(CYAN)Project Status$(RESET)"
	@echo "=============="
	@echo "Node version: $$(node --version)"
	@echo "PNPM version: $$(pnpm --version)"
	@echo "Git branch: $$(git branch --show-current 2>/dev/null || echo 'No git repository')"
	@echo "Git status: $$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') uncommitted changes"
	@echo ""
	@echo "$(YELLOW)Packages:$(RESET)"
	@ls -la packages/ | grep "^d" | awk '{print "  " $$9}' | grep -v "^\.\.*$$"
	@echo ""
	@echo "$(YELLOW)Apps:$(RESET)"
	@ls -la apps/ | grep "^d" | awk '{print "  " $$9}' | grep -v "^\.\.*$$" 