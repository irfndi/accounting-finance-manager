# Finance Manager

A comprehensive corporate finance management platform featuring dual-stack architecture with modern web frontend and robust backend API.

## 🏗️ Architecture

### Dual-Stack Architecture

The platform features two distinct backends for different use cases:

#### Frontend Stack (TypeScript/Cloudflare Workers)
```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Astro + React Islands)                                        │
│     ⬇ fetch                                                           │
│  Cloudflare Worker (Hono router) ──▶  D1 (SQLite, ACID)               │
│        │                         ├─▶  R2 (files, receipts)            │
│        │                         ├─▶  KV (sessions, cache)           │
│        │                         ├─▶  AI (OCR & LLM processing)      │
│        └─▶ AWS SES (email notifications)                              │
└────────────────────────────────────────────────────────────────────────┘
```

#### Backend Stack (Go/PostgreSQL)
```
┌────────────────────────────────────────────────────────────────────────┐
│  Client Applications                                                 │
│     ⬇ HTTP/REST                                                       │
│  Go Server (Gin framework) ──▶  PostgreSQL (ACID)                   │
│        │                    ├─▶  Redis (cache/sessions)             │
│        │                    ├─▶  ClickHouse (analytics)             │
│        └─▶ AWS SES (email notifications)                              │
└────────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🧮 Core Accounting Engine

- **Double-Entry Bookkeeping**: ACID-compliant transactions with automatic balance validation
- **Multi-Currency Support**: IDR primary with extensible currency system
- **Real-Time Financial Statements**: Balance Sheet, P&L, Cash Flow with live calculations
- **Account Management**: Hierarchical chart of accounts with type validation
- **Journal Entry System**: Comprehensive validation and audit trails
- **Budget Management**: Multi-period budgeting with revision tracking
- **Category Management**: Flexible transaction categorization with statistics

### 🤖 AI-Powered Features

- **Document OCR**: Cloudflare AI for receipt and invoice text extraction
- **Smart Categorization**: OpenRouter LLM for intelligent expense classification
- **Financial Analysis**: AI-driven insights and recommendations
- **Semantic Search**: Vector-powered document discovery
- **Automated Bookkeeping**: AI-assisted transaction entry and validation

### 🔐 Security & Authentication

- **Magic Link Authentication**: Passwordless login via AWS SES
- **JWT Session Management**: HS256 signed tokens with KV/Redis storage
- **Argon2id Password Hashing**: Edge-optimized security
- **CSRF Protection**: OWASP-compliant token validation
- **Audit Logging**: Immutable transaction history
- **Rate Limiting**: IP-based rate limiting for API protection
- **Input Validation**: Comprehensive validation on all endpoints

### 📊 Financial Reporting

- **Multi-Format Export**: CSV, PDF, Excel with professional formatting
- **Real-Time Calculations**: Live balance updates and statement generation
- **Performance Optimization**: Intelligent caching and query optimization
- **Compliance Ready**: Audit trails and regulatory reporting support
- **Custom Reports**: Flexible reporting system with trial balance, income statement, balance sheet

## 🚀 Technology Stack

### Frontend Stack (TypeScript/Cloudflare Workers)

#### Runtime & Infrastructure
- **Cloudflare Workers**: Edge computing platform
- **Hono**: Fast, lightweight web framework
- **TypeScript**: Type-safe development
- **Astro**: Modern static site generator with islands architecture

#### Data & Storage
- **Cloudflare D1**: SQLite-compatible serverless database
- **Drizzle ORM**: Type-safe SQL query builder
- **Cloudflare R2**: Object storage for files and receipts
- **Cloudflare KV**: Key-value store for sessions and cache
- **Cloudflare AI**: OCR and LLM processing

#### AI & Machine Learning
- **OpenRouter**: Primary LLM provider (qwen/qwen3-235b-a22b:free)
- **Anthropic**: Claude AI integration
- **Cloudflare AI**: OCR and document processing

### Backend Stack (Go/PostgreSQL)

#### Runtime & Infrastructure
- **Go**: High-performance backend language
- **Gin**: Fast HTTP web framework
- **PostgreSQL**: Robust relational database
- **Redis**: In-memory data structure store

#### Data & Analytics
- **ClickHouse**: Column-oriented database for analytics
- **Drizzle ORM**: Type-safe SQL query builder (Go version)

#### Development & Operations
- **Docker**: Containerization for consistent deployment
- **Nginx**: Reverse proxy and load balancer
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and monitoring

### Development & Testing (Shared)

- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing
- **OxLint + Prettier**: Code quality and formatting
- **GitHub Actions**: CI/CD pipeline
- **pnpm**: Fast, efficient package manager
- **Alchemy**: Infrastructure-as-Code for Cloudflare

## 🛠️ Development

### Prerequisites

#### For Frontend Development
- Node.js 22+
- pnpm 9+
- Cloudflare account with Workers, D1, R2, KV, and AI enabled

#### For Backend Development
- Go 1.21+
- PostgreSQL 13+
- Redis 6+
- Docker (optional)

### Quick Start

#### Frontend Development (TypeScript/Cloudflare Workers)

```bash
# Clone and install dependencies
git clone <repository-url>
cd finance-manager
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Cloudflare and AWS credentials

# Start development servers
pnpm dev          # Astro frontend
pnpm dev:worker   # Cloudflare Worker
pnpm dev:all      # Both servers
```

#### Backend Development (Go/PostgreSQL)

```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# Set up database
createdb finance_manager
psql -h localhost -U postgres -d finance_manager -f ../migrations/001_initial_schema.sql
psql -h localhost -U postgres -d finance_manager -f ../migrations/002_initial_data.sql

# Start the server
go run cmd/server/main.go
```

### Available Commands

#### Frontend Commands

```bash
# Development
pnpm dev              # Start Astro development server
pnpm dev:worker       # Start Worker development server
pnpm dev:all          # Start all development servers
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run unit tests
pnpm test:workers     # Run Workers-specific tests
pnpm test:react       # Run React component tests
pnpm test:e2e         # Run E2E tests
pnpm test:all         # Run all test suites
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm typecheck        # TypeScript type checking
pnpm lint             # Run OxLint
pnpm format           # Format with Prettier

# Database (D1)
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio

# Deployment
pnpm deploy           # Deploy with Alchemy
pnpm deploy:prod      # Deploy to production
pnpm tail             # Stream development logs
```

#### Backend Commands

```bash
# Development (from backend directory)
go run cmd/server/main.go    # Start development server
go build -o server cmd/server/main.go  # Build for production

# Testing
go test ./...                 # Run all tests
go test -v ./internal/models  # Run specific package tests

# Database
make migrate                  # Run database migrations
make rollback                 # Rollback migrations
make seed                    # Seed database with initial data

# Docker
docker build -t finance-manager-backend .  # Build Docker image
docker run -p 8080:8080 finance-manager-backend  # Run container
```

### Project Structure

```
.
├── src/                          # Frontend TypeScript source
│   ├── ai/                       # AI services and providers
│   ├── db/                       # Database schema (D1/Drizzle)
│   ├── lib/                      # Shared utilities and business logic
│   ├── types/                    # TypeScript type definitions
│   ├── web/                      # Astro frontend application
│   │   ├── components/           # React components
│   │   ├── layouts/              # Astro layouts
│   │   ├── pages/                # Astro pages and routes
│   │   └── lib/                  # Web-specific utilities
│   └── worker/                   # Cloudflare Worker application
│       ├── routes/               # API route handlers
│       ├── middleware/           # Worker middleware
│       ├── services.ts           # Worker services
│       └── index.ts              # Worker entry point
├── backend/                      # Go backend application
│   ├── cmd/server/               # Application entry point
│   ├── internal/                 # Internal application code
│   │   ├── config/               # Configuration management
│   │   ├── handlers/             # HTTP request handlers
│   │   ├── middleware/           # HTTP middleware
│   │   ├── models/               # Data models and structures
│   │   ├── repositories/         # Data access layer
│   │   ├── routes/               # Route definitions
│   │   └── services/             # Business logic services
│   ├── pkg/                      # Public packages
│   │   ├── database/             # Database connection and utilities
│   │   ├── redis/                # Redis connection and utilities
│   │   └── telemetry/            # Monitoring and observability
│   └── go.mod, go.sum           # Go module files
├── migrations/                   # Database migrations (shared)
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   └── e2e/                      # End-to-end tests
├── docs/                         # Documentation
├── observability/                # Monitoring and observability configs
├── frontend/                     # Frontend Docker assets
├── backend/                      # Backend Docker assets
├── nginx/                        # Nginx configuration
├── postgres/                     # PostgreSQL configuration
├── redis/                        # Redis configuration
├── .taskmaster/                  # Project management
├── alchemy.*.ts                  # Infrastructure-as-Code configs
├── wrangler.jsonc                # Cloudflare Workers configuration
├── vitest.*.config.ts           # Testing configurations
├── playwright.*.config.ts        # E2E test configurations
└── package.json                  # Node.js dependencies
```

## 🧪 Testing

The project maintains high test coverage with comprehensive testing at all levels across both stacks:

### Frontend Testing (TypeScript/Cloudflare Workers)

#### Test Types
- **Unit Tests**: Core business logic with Vitest
- **Workers Tests**: Cloudflare Workers runtime with Miniflare
- **React Tests**: Component testing with Testing Library
- **E2E Tests**: Full user workflows with Playwright
- **Coverage**: 80%+ line and branch coverage target

#### Test Configuration
- `vitest.config.ts` - Main Vitest configuration for Workers
- `vitest.coverage.config.ts` - Coverage reporting
- `vitest.react.config.ts` - React component testing
- `playwright.config.ts` - Full E2E configuration
- `playwright.minimal.config.ts` - Minimal E2E tests

#### Test Commands
```bash
# Run all tests
pnpm test:all

# Run specific test types
pnpm test             # Unit tests
pnpm test:workers     # Workers tests
pnpm test:react       # React component tests
pnpm test:e2e         # E2E tests

# Coverage and debugging
pnpm test:coverage    # Run with coverage
pnpm test:ui          # Interactive Vitest UI
pnpm test:e2e:debug   # Debug E2E tests
```

### Backend Testing (Go/PostgreSQL)

#### Test Types
- **Unit Tests**: Business logic and model testing
- **Integration Tests**: Database and external service testing
- **API Tests**: HTTP endpoint testing
- **Benchmark Tests**: Performance testing

#### Test Commands
```bash
# From backend directory
go test ./...                    # Run all tests
go test -v ./internal/models     # Test specific package
go test -cover                   # Run with coverage
go test -bench=.                 # Run benchmarks
```

### Test Structure

```
tests/
├── unit/
│   ├── worker/                  # Worker-specific tests
│   ├── api/                     # API endpoint tests
│   ├── auth/                    # Authentication tests
│   ├── db/                      # Database tests
│   ├── ai/                      # AI service tests
│   └── lib/                     # Utility tests
├── e2e/                         # End-to-end tests
│   ├── auth.spec.ts             # Authentication flows
│   ├── dashboard.spec.ts        # Dashboard functionality
│   ├── accounts.spec.ts         # Account management
│   └── transactions.spec.ts     # Transaction processing
└── backend/                     # Backend tests
    ├── handlers/                # Handler tests
    ├── services/                # Service tests
    ├── models/                  # Model tests
    └── integration/             # Integration tests
```

## 🚀 Deployment

### Frontend Deployment (Cloudflare Workers)

#### Production Deployment

1. **Configure Cloudflare Resources**:

   ```bash
   # Create D1 database
   wrangler d1 create finance-manager-db-prod

   # Create KV namespace
   wrangler kv:namespace create "FINANCE_MANAGER_CACHE" --env production

   # Create R2 bucket
   wrangler r2 bucket create finance-manager-docs-prod
   ```

2. **Set Environment Variables**:

   ```bash
   # Set secrets
   wrangler secret put JWT_SECRET --env production
   wrangler secret put OPENROUTER_API_KEY --env production
   wrangler secret put AWS_SES_ACCESS_KEY --env production
   wrangler secret put AWS_SES_SECRET_KEY --env production
   ```

3. **Deploy**:
   ```bash
   pnpm deploy:prod
   ```

### Backend Deployment (Go/PostgreSQL)

#### Production Deployment

1. **Database Setup**:
   ```bash
   # Create PostgreSQL database
   createdb finance_manager_prod
   
   # Run migrations
   psql -h localhost -U postgres -d finance_manager_prod -f migrations/001_initial_schema.sql
   psql -h localhost -U postgres -d finance_manager_prod -f migrations/002_initial_data.sql
   ```

2. **Environment Configuration**:
   ```bash
   # Set environment variables
   export DB_HOST=your-db-host
   export DB_PORT=5432
   export DB_NAME=finance_manager_prod
   export DB_USER=your-db-user
   export DB_PASSWORD=your-db-password
   export REDIS_HOST=your-redis-host
   export JWT_SECRET=your-jwt-secret
   ```

3. **Docker Deployment**:
   ```bash
   # Build Docker image
   docker build -t finance-manager-backend -f backend/Dockerfile .
   
   # Run with Docker Compose
   docker-compose up -d
   ```

### Environment Configuration

The application supports multiple environments:

#### Frontend Environments
- **Development**: Local with Miniflare emulation
- **Staging**: Cloudflare Workers with staging resources
- **Production**: Full Cloudflare deployment

#### Backend Environments
- **Development**: Local PostgreSQL/Redis
- **Staging**: Staging database and services
- **Production**: Production database and services

## 📊 Monitoring & Observability

### Frontend Monitoring (Cloudflare Workers)
- **Cloudflare Analytics**: Request metrics and performance monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Audit Trails**: Complete transaction and user activity logging
- **Performance Metrics**: Response times and resource utilization
- **Alchemy Monitoring**: Infrastructure monitoring and alerting

### Backend Monitoring (Go/PostgreSQL)
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboarding
- **ClickHouse**: Analytics and log aggregation
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Health Checks**: Comprehensive health check endpoints
- **Distributed Tracing**: Request tracing across services

### Observability Stack
- **Metrics**: CPU, memory, database connections, API response times
- **Logs**: Structured logging with levels and contexts
- **Traces**: Distributed tracing for request flows
- **Alerts**: Configurable alerts for critical metrics
- **Dashboards**: Real-time monitoring dashboards

## 🔧 Configuration

### AI Models

The application uses the following AI models:

- **Primary**: `qwen/qwen3-235b-a22b:free` (OpenRouter)
- **Fallback**: `moonshotai/kimi-k2:free` (Moonshot AI)
- **OCR**: Cloudflare AI models for document processing
- **Claude**: Anthropic Claude AI integration

### Database Schema

The application uses a double-entry accounting schema with:

#### Frontend Database (D1/SQLite)
- **Accounts**: Chart of accounts with hierarchical structure
- **Transactions**: Financial transactions with ACID compliance
- **Journal Entries**: Individual debit/credit entries
- **Users**: Authentication and authorization
- **Sessions**: User session management
- **Magic Links**: Passwordless authentication
- **Audit Logs**: Immutable activity tracking
- **Documents**: File uploads and metadata
- **Categories**: Transaction categorization
- **Budgets**: Budget management and tracking

#### Backend Database (PostgreSQL)
- **Accounts**: Chart of accounts with hierarchical structure
- **Transactions**: Financial transactions with ACID compliance
- **Categories**: Category management with statistics
- **Users**: User management and authentication
- **Sessions**: Session management with Redis
- **Audit Logs**: Comprehensive audit trail

### Environment Variables

#### Frontend Environment
```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# AI Services
OPENROUTER_API_KEY=your_openrouter_key
ANTHROPIC_API_KEY=your_anthropic_key

# Email Services
AWS_SES_ACCESS_KEY=your_ses_access_key
AWS_SES_SECRET_KEY=your_ses_secret_key
AWS_SES_REGION=us-east-1

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

#### Backend Environment
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_manager
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server Configuration
SERVER_PORT=8080
ENVIRONMENT=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `make test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **OxLint**: Fast, modern linting with custom rules
- **Prettier**: Consistent code formatting
- **Test Coverage**: Minimum 80% line coverage
- **Documentation**: JSDoc comments for public APIs
- **Type Safety**: Comprehensive TypeScript coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### 📖 API Documentation
- **[API Reference](docs/API.md)** - Complete API documentation with all endpoints, request/response formats, and authentication
- **Authentication** - JWT-based authentication with magic link support
- **Error Handling** - Standardized error responses and status codes
- **Rate Limiting** - API usage limits and throttling

### 👥 User Guide
- **[User Guide](docs/USER_GUIDE.md)** - Comprehensive user documentation covering all features
- **Getting Started** - Initial setup and account configuration
- **Feature Tutorials** - Step-by-step guides for all major features
- **Mobile Usage** - Mobile app features and offline capabilities
- **Security Best Practices** - Account security and data protection

### 🔧 Setup & Installation
- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration instructions
- **Development Setup** - Local development environment configuration
- **Production Deployment** - Cloud deployment and infrastructure setup
- **Configuration** - Environment variables and feature flags
- **Troubleshooting** - Common issues and solutions

### 📋 Quick Links
- [API Documentation](docs/API.md) - Complete API reference
- [User Guide](docs/USER_GUIDE.md) - User documentation  
- [Setup Guide](docs/SETUP.md) - Installation and deployment
- [Examples](docs/examples/) - Code examples and integration guides

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` directory for comprehensive guides
- **API Reference**: [API Documentation](docs/API.md) for technical integration
- **User Guide**: [User Guide](docs/USER_GUIDE.md) for feature usage
- **Setup Issues**: [Setup Guide](docs/SETUP.md) for installation problems
- **Issues**: Open a GitHub issue for bugs and feature requests
- **Discussions**: Use GitHub Discussions for general questions

## 🗺️ Roadmap

- [ ] Multi-tenant support
- [ ] Advanced reporting dashboard
- [ ] Mobile application
- [ ] Third-party integrations (banks, payment processors)
- [ ] Advanced AI features (predictive analytics, anomaly detection)
- [ ] Compliance modules (tax reporting, audit preparation)

---

**Built with ❤️ using Cloudflare Workers and modern web technologies**
