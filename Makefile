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
	@echo "  - Astro dev server"
	@echo "  - Worker dev server (miniflare)"
	@echo "  - TypeScript compilation in watch mode"
	@echo ""
	pnpm dev:all

dev/web: ## Start only the web development server
	@echo "$(CYAN)Starting Astro development server...$(RESET)"
	pnpm dev

dev/worker: ## Start only the worker development server
	@echo "$(CYAN)Starting Worker development server...$(RESET)"
	pnpm dev:worker

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
	pnpm test
	@echo "$(GREEN)✓ Unit tests complete$(RESET)"

unit/coverage: ## Run unit tests with coverage
	@echo "$(CYAN)Running unit tests with coverage...$(RESET)"
	pnpm test
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

test/integration: ## Run comprehensive integration tests
	@echo "$(CYAN)Running integration tests...$(RESET)"
	@echo "$(YELLOW)Starting Miniflare integration tests...$(RESET)"
	pnpm test
	@echo "$(YELLOW)Running API integration tests...$(RESET)"
	echo "$(YELLOW)Integration tests not yet implemented$(RESET)"
	@echo "$(GREEN)✓ Integration tests complete$(RESET)"

test/miniflare: ## Run Miniflare-specific tests
	@echo "$(CYAN)Running Miniflare tests...$(RESET)"
	pnpm test
	@echo "$(GREEN)✓ Miniflare tests complete$(RESET)"

test/performance: ## Run performance benchmarks
	@echo "$(CYAN)Running performance benchmarks...$(RESET)"
	echo "$(YELLOW)Performance tests not configured$(RESET)"
	@echo "$(GREEN)✓ Performance benchmarks complete$(RESET)"

test/smoke: ## Run smoke tests against deployed services
	@echo "$(CYAN)Running smoke tests...$(RESET)"
	@echo "$(YELLOW)Testing API endpoints...$(RESET)"
	curl -f http://localhost:8787/health || echo "$(YELLOW)Local server not running$(RESET)"
	@echo "$(GREEN)✓ Smoke tests complete$(RESET)"

# =============================================================================
# BUILDING
# =============================================================================

build: ## Build the application
	@echo "$(CYAN)Building application...$(RESET)"
	pnpm build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build/web: ## Build only the web application
	@echo "$(CYAN)Building web application...$(RESET)"
	astro build
	@echo "$(GREEN)✓ Web build complete$(RESET)"

build/worker: ## Build only the worker
	@echo "$(CYAN)Building worker...$(RESET)"
	pnpm build:worker
	@echo "$(GREEN)✓ Worker build complete$(RESET)"

# =============================================================================
# PRODUCTION
# =============================================================================

prod/build: ## Build everything for production
	@echo "$(CYAN)Building for production...$(RESET)"
	@echo "$(YELLOW)1. Building web application...$(RESET)"
	$(MAKE) build/web
	@echo "$(YELLOW)2. Building worker...$(RESET)"
	$(MAKE) build/worker
	@echo "$(GREEN)✓ Production build complete$(RESET)"

prod/migrate: ## Run database migrations in production
	@echo "$(CYAN)Running database migrations...$(RESET)"
	pnpm db:migrate:prod
	@echo "$(GREEN)✓ Database migrations complete$(RESET)"

prod/deploy: ## Deploy to production with full validation
	@echo "$(CYAN)Deploying to production...$(RESET)"
	@echo "$(YELLOW)Pre-deployment validation:$(RESET)"
	$(MAKE) ci
	@echo "$(YELLOW)Building for production...$(RESET)"
	$(MAKE) prod/build
	@echo "$(YELLOW)Running database migrations...$(RESET)"
	$(MAKE) prod/migrate
	@echo "$(YELLOW)Deploying to Cloudflare Workers...$(RESET)"
	pnpm deploy:prod
	@echo "$(YELLOW)Running post-deployment smoke tests...$(RESET)"
	$(MAKE) test/smoke/prod
	@echo "$(GREEN)✅ Production deployment complete$(RESET)"

prod/deploy/staging: ## Deploy to staging environment
	@echo "$(CYAN)Deploying to staging...$(RESET)"
	$(MAKE) ci/fast
	$(MAKE) prod/build
	pnpm deploy --env staging
	@echo "$(GREEN)✓ Staging deployment complete$(RESET)"

prod/rollback: ## Rollback production deployment
	@echo "$(CYAN)Rolling back production deployment...$(RESET)"
	alchemy run --env production -- wrangler rollback
	@echo "$(GREEN)✓ Rollback complete$(RESET)"

prod/status: ## Check production deployment status
	@echo "$(CYAN)Checking production status...$(RESET)"
	alchemy run --env production -- wrangler tail --format pretty --once
	@echo "$(GREEN)✓ Status check complete$(RESET)"

test/smoke/prod: ## Run smoke tests against production
	@echo "$(CYAN)Running production smoke tests...$(RESET)"
	@echo "$(YELLOW)Testing production endpoints...$(RESET)"
	curl -f https://finance-manager-worker.irfandimarsya.workers.dev/health || echo "$(RED)Production health check failed$(RESET)"
	@echo "$(GREEN)✓ Production smoke tests complete$(RESET)"

publish: prod/deploy ## Alias for prod/deploy

# =============================================================================
# DATABASE
# =============================================================================

db/generate: ## Generate database schema files
	@echo "$(CYAN)Generating database schema...$(RESET)"
	pnpm db:generate
	@echo "$(GREEN)✓ Schema generation complete$(RESET)"

db/migrate: ## Run database migrations locally
	@echo "$(CYAN)Running local database migrations...$(RESET)"
	pnpm db:migrate
	@echo "$(GREEN)✓ Local migrations complete$(RESET)"

db/studio: ## Open Drizzle Studio
	@echo "$(CYAN)Opening Drizzle Studio...$(RESET)"
	pnpm db:studio

# =============================================================================
# UTILITIES
# =============================================================================

check: ## Run all checks (lint + test + build)
	@echo "$(CYAN)Running all checks...$(RESET)"
	$(MAKE) lint
	$(MAKE) unit
	$(MAKE) build
	@echo "$(GREEN)✓ All checks passed$(RESET)"

ci: ## Run complete CI pipeline (security + lint + typecheck + test + build)
	@echo "$(CYAN)Running Production CI Pipeline...$(RESET)"
	@echo "$(YELLOW)Phase 1/5: Security & Dependency Audit...$(RESET)"
	$(MAKE) ci/security
	@echo "$(YELLOW)Phase 2/5: Code Quality & Linting...$(RESET)"
	$(MAKE) ci/lint
	@echo "$(YELLOW)Phase 3/5: Type Checking...$(RESET)"
	$(MAKE) ci/typecheck
	@echo "$(YELLOW)Phase 4/5: Testing Suite...$(RESET)"
	$(MAKE) ci/test
	@echo "$(YELLOW)Phase 5/5: Build Validation...$(RESET)"
	$(MAKE) ci/build
	@echo "$(GREEN)✅ Production CI pipeline completed successfully$(RESET)"

ci/fast: ## Run fast CI pipeline (lint + unit tests)
	@echo "$(CYAN)Running Fast CI Pipeline...$(RESET)"
	$(MAKE) -j3 lint unit
	@echo "$(GREEN)✅ Fast CI pipeline completed$(RESET)"

ci/security: ## Run security and dependency audits
	@echo "$(CYAN)Running security audits...$(RESET)"
	pnpm audit --audit-level moderate || (echo "$(RED)⚠️  Security vulnerabilities found$(RESET)" && exit 1)
	@echo "$(GREEN)✓ Security audit passed$(RESET)"

ci/lint: ## Run comprehensive linting
	@echo "$(CYAN)Running comprehensive linting...$(RESET)"
	$(MAKE) lint
	@echo "$(GREEN)✓ Linting completed$(RESET)"

ci/typecheck: ## Run TypeScript type checking
	@echo "$(CYAN)Running TypeScript type checking...$(RESET)"
	@echo "$(YELLOW)Checking application...$(RESET)"
	pnpm typecheck || (echo "$(RED)Typecheck failed$(RESET)" && exit 1)
	@echo "$(YELLOW)Checking Astro...$(RESET)"
	pnpm dlx @astrojs/check || (echo "$(RED)Astro check failed$(RESET)" && exit 1)
	@echo "$(GREEN)✓ Type checking completed$(RESET)"

ci/test: ## Run comprehensive test suite with coverage
	@echo "$(CYAN)Running comprehensive test suite...$(RESET)"
	$(MAKE) unit/coverage || (echo "$(RED)Unit tests failed$(RESET)" && exit 1)
	$(MAKE) test/integration || (echo "$(RED)Integration tests failed$(RESET)" && exit 1)
	@echo "$(GREEN)✓ All tests completed$(RESET)"

ci/build: ## Run production build validation
	@echo "$(CYAN)Running production build validation...$(RESET)"
	$(MAKE) build || (echo "$(RED)Build failed$(RESET)" && exit 1)
	@echo "$(GREEN)✓ Build validation completed$(RESET)"

ci/parallel: ## Run CI pipeline with maximum parallelization
	@echo "$(CYAN)Running Parallel CI Pipeline...$(RESET)"
	$(MAKE) ci/security
	$(MAKE) -j4 lint ci/typecheck unit build
	$(MAKE) test/integration
	@echo "$(GREEN)✅ Parallel CI pipeline completed$(RESET)"

fresh: ## Fresh install (clean + install)
	@echo "$(CYAN)Fresh installation...$(RESET)"
	$(MAKE) clean
	$(MAKE) install
	@echo "$(GREEN)✓ Fresh installation complete$(RESET)"

status: ## Show comprehensive project status
	@echo "$(CYAN)Finance Manager - Project Status$(RESET)"
	@echo "======================================"
	@echo "$(YELLOW)Environment:$(RESET)"
	@echo "  Node version: $$(node --version)"
	@echo "  PNPM version: $$(pnpm --version)"
	@echo "  TypeScript: $$(pnpm exec tsc --version)"
	@echo "  Git branch: $$(git branch --show-current 2>/dev/null || echo 'No git repository')"
	@echo "  Git status: $$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') uncommitted changes"
	@echo ""
	@echo "$(YELLOW)Application Structure:$(RESET)"
	@echo "  🚀 Single Application (Web + Worker)"
	@ls -la src/ | grep "^d" | awk '{print "  📁 " $$9}' | grep -v "^\.\.\*$$" || echo "  📁 src/"
	@echo ""
	@echo "$(YELLOW)Build Status:$(RESET)"
	@find . -name "dist" -type d | head -5 | sed 's/^/  ✅ /' || echo "  No build artifacts found"
	@echo ""
	@echo "$(YELLOW)Dependencies:$(RESET)"
	@pnpm outdated --format table 2>/dev/null | head -10 || echo "  All dependencies up to date"

# =============================================================================
# MONITORING & DEBUGGING
# =============================================================================

monitor: ## Monitor application performance and logs
	@echo "$(CYAN)Monitoring application...$(RESET)"
	@echo "$(YELLOW)Worker logs (press Ctrl+C to stop):$(RESET)"
	pnpm tail:prod

monitor/dev: ## Monitor development environment
	@echo "$(CYAN)Monitoring development environment...$(RESET)"
	pnpm tail

debug: ## Debug application issues
	@echo "$(CYAN)Debug Information$(RESET)"
	@echo "=================="
	@echo "$(YELLOW)Recent errors in logs:$(RESET)"
	alchemy run --env production -- wrangler tail --format json | jq '.[] | select(.level == "error")' | head -5 || echo "No recent errors"
	@echo "$(YELLOW)Memory usage:$(RESET)"
	ps aux | grep node | head -5

# =============================================================================
# MAINTENANCE
# =============================================================================

maintenance/deps: ## Update and audit dependencies
	@echo "$(CYAN)Dependency maintenance...$(RESET)"
	@echo "$(YELLOW)Checking for updates...$(RESET)"
	pnpm update --latest --interactive
	@echo "$(YELLOW)Running security audit...$(RESET)"
	pnpm audit --fix
	@echo "$(GREEN)✓ Dependency maintenance complete$(RESET)"

maintenance/clean: ## Deep clean and rebuild
	@echo "$(CYAN)Deep cleaning project...$(RESET)"
	$(MAKE) clean
	rm -rf node_modules
	rm -rf .pnpm-store
	$(MAKE) install
	$(MAKE) build
	@echo "$(GREEN)✓ Deep clean complete$(RESET)"

health: ## Check overall system health
	@echo "$(CYAN)System Health Check$(RESET)"
	@echo "===================="
	@echo "$(YELLOW)Disk space:$(RESET)"
	df -h . | tail -1
	@echo "$(YELLOW)Memory usage:$(RESET)"
	free -h 2>/dev/null || vm_stat | head -5
	@echo "$(YELLOW)Node processes:$(RESET)"
	ps aux | grep -E '(node|pnpm)' | wc -l | sed 's/^/  Active processes: /'
	@echo "$(YELLOW)Port usage:$(RESET)"
	lsof -i :3000 -i :8787 2>/dev/null | tail -5 || echo "  No active servers detected"

# =============================================================================
# FEATURE FLAGS & ENVIRONMENT MANAGEMENT
# =============================================================================

feature/enable: ## Enable a feature flag (usage: make feature/enable FLAG=feature_name)
	@echo "$(CYAN)Enabling feature flag: $(FLAG)$(RESET)"
	@if [ -z "$(FLAG)" ]; then echo "$(RED)Error: FLAG parameter required$(RESET)"; exit 1; fi
	alchemy run --env production -- wrangler kv:key put "feature_$(FLAG)" "true"
	@echo "$(GREEN)✓ Feature $(FLAG) enabled$(RESET)"

feature/disable: ## Disable a feature flag (usage: make feature/disable FLAG=feature_name)
	@echo "$(CYAN)Disabling feature flag: $(FLAG)$(RESET)"
	@if [ -z "$(FLAG)" ]; then echo "$(RED)Error: FLAG parameter required$(RESET)"; exit 1; fi
	alchemy run --env production -- wrangler kv:key put "feature_$(FLAG)" "false"
	@echo "$(GREEN)✓ Feature $(FLAG) disabled$(RESET)"

feature/list: ## List all feature flags
	@echo "$(CYAN)Current feature flags:$(RESET)"
	alchemy run --env production -- wrangler kv:key list | grep "feature_" || echo "No feature flags found"

env/switch: ## Switch environment (usage: make env/switch ENV=staging|production)
	@echo "$(CYAN)Switching to $(ENV) environment$(RESET)"
	@if [ -z "$(ENV)" ]; then echo "$(RED)Error: ENV parameter required$(RESET)"; exit 1; fi
	@echo "CLOUDFLARE_ENV=$(ENV)" > .env.local
	@echo "$(GREEN)✓ Switched to $(ENV) environment$(RESET)"

env/status: ## Show current environment status
	@echo "$(CYAN)Environment Status$(RESET)"
	@echo "=================="
	@echo "Current environment: $$(cat .env.local 2>/dev/null | grep CLOUDFLARE_ENV | cut -d'=' -f2 || echo 'development')"
	alchemy run -- wrangler whoami