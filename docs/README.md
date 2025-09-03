# Finance Manager

A comprehensive corporate finance management platform built with modern web technologies, featuring a dual-stack architecture with Astro frontend and Go backend API.

## 🏗️ Architecture

### Modern Dual-Stack Architecture

The platform features a clean separation of concerns with a modern frontend and robust backend:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Astro + React Islands)                                        │
│     ⬇ HTTP/REST                                                        │
│  Nginx Reverse Proxy ──▶  Astro Frontend (Port 3000)                   │
│        │                    ├─▶  Go API Backend (Port 8080)            │
│        │                    ├─▶  PostgreSQL (Database)                │
│        │                    ├─▶  Redis (Cache/Sessions)               │
│        └─▶ AWS SES (email notifications)                              │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### Frontend Layer (Astro + React)
- **Framework**: Astro 5.12.8 with React islands architecture
- **Styling**: Tailwind CSS 4.1.11 with Radix UI components
- **Language**: TypeScript 5.9.2 with strict mode
- **Runtime**: Bun 1.2.21+ for development and building
- **Testing**: Vitest 3.2.4 + Testing Library + Playwright

#### Backend Layer (Go API)
- **Language**: Go 1.21+ with Gin framework
- **Database**: PostgreSQL 15+ with Drizzle ORM
- **Cache**: Redis 7+ for sessions and caching
- **Authentication**: JWT-based with secure session management
- **Testing**: Built-in Go testing toolkit

#### Infrastructure Layer (Docker + VPS)
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with SSL support
- **Deployment**: VPS with automated deployment scripts
- **Monitoring**: Health checks and logging

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

- **Document OCR**: AI-powered receipt and invoice text extraction
- **Smart Categorization**: LLM integration for intelligent expense classification
- **Financial Analysis**: AI-driven insights and recommendations
- **Automated Bookkeeping**: AI-assisted transaction entry and validation

### 🔐 Security & Authentication

- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Redis-based session storage with automatic cleanup
- **Password Security**: Secure password hashing and validation
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

### 🚀 Developer Experience

- **Modern Toolchain**: Bun for fast package management and builds
- **Hot Reload**: Instant feedback during development
- **TypeScript Coverage**: Full type safety across the entire application
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **Docker Support**: Containerized development and deployment
- **Automated Deployment**: One-click VPS deployment

## 🚀 Technology Stack

### Frontend Stack (Astro + React)

#### Runtime & Framework
- **Astro**: Modern web framework with islands architecture
- **React**: UI library for interactive components
- **TypeScript**: Type-safe development with strict mode
- **Bun**: Fast JavaScript runtime and package manager

#### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Lucide React**: Beautiful icon library
- **Class Variance Authority**: Type-safe styling variants

#### Testing & Development
- **Vitest**: Fast unit testing framework
- **Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **OxLint**: Modern, fast linter
- **Prettier**: Code formatting

### Backend Stack (Go API)

#### Runtime & Framework
- **Go**: High-performance backend language
- **Gin**: Fast HTTP web framework
- **Air**: Hot reload for development

#### Database & Storage
- **PostgreSQL**: Robust relational database
- **Redis**: In-memory data structure store for caching
- **Drizzle ORM**: Type-safe SQL query builder

#### Security & Authentication
- **JWT**: JSON Web Token authentication
- **bcrypt**: Secure password hashing
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection

### Infrastructure & Deployment

#### Containerization
- **Docker**: Containerization for consistent deployment
- **Docker Compose**: Multi-container application management
- **Nginx**: Reverse proxy and load balancer
- **SSL**: HTTPS termination and security

#### Deployment & Operations
- **VPS**: Virtual Private Server deployment
- **Automated Scripts**: One-click deployment
- **Health Checks**: Service monitoring
- **Backup System**: Automated database backups

### Development Tools

#### Package Management
- **Bun**: Primary package manager and runtime
- **Go Modules**: Go dependency management

#### Code Quality
- **OxLint**: Fast, modern linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Go Testing**: Built-in testing framework

#### CI/CD & Monitoring
- **GitHub Actions**: Continuous integration and deployment
- **Health Monitoring**: Service health checks
- **Logging**: Structured logging
- **Error Tracking**: Comprehensive error reporting

## 🛠️ Development

### Prerequisites

- **Bun**: 1.2.21+ (primary package manager and runtime)
- **Go**: 1.21+ (backend development)
- **Node.js**: 18+ (for some development tools)
- **PostgreSQL**: 15+ (database)
- **Redis**: 7+ (caching)
- **Docker**: 20.10+ (containerization)

### Quick Start

#### Installation

```bash
# Clone the repository
git clone <repository-url>
cd finance-manager

# Install all dependencies
bun run install:all

# Or install individually
bun install                    # Root dependencies
cd apps/web && bun install     # Frontend dependencies
```

#### Environment Setup

```bash
# Copy environment template
cp config/.env.example config/.env

# Edit environment variables
# Required: Database, Redis, JWT, SMTP configurations
nano config/.env
```

#### Development Servers

```bash
# Start both frontend and backend
bun run dev
# Or using Makefile
make dev

# Start frontend only (Astro + React)
bun run dev:web
# Or using Makefile
make dev/web

# Start backend only (Go API)
bun run dev:api
# Or using Makefile
make dev/api
```

#### Docker Development

```bash
# Start all services with Docker
cd infrastructure
docker-compose up -d
# Or using root script
bun run docker:up
# Or using Makefile
make docker/up
```

#### Testing

```bash
# Run all tests
bun run test:all
# Or using Makefile
make test

# Run specific test suites
bun run test:web      # Frontend tests
bun run test:api      # Backend tests
bun run test:e2e      # End-to-end tests
bun run test:coverage # Coverage reports
```

### Available Commands

#### Root Package Commands (Unified Development)

```bash
# Development
bun run dev              # Start both frontend and backend
bun run dev:web          # Start Astro development server only
bun run dev:api          # Start Go API server only

# Building
bun run build            # Build frontend for production
bun run build:api        # Build Go backend for production
bun run preview          # Preview production build

# Testing
bun run test             # Run unit tests
bun run test:web         # Run frontend tests
bun run test:api         # Run backend tests
bun run test:e2e         # Run end-to-end tests
bun run test:all         # Run all test suites
bun run test:coverage    # Run tests with coverage

# Code Quality
bun run typecheck        # TypeScript type checking
bun run lint             # Run OxLint
bun run lint:fix         # Fix linting issues
bun run format           # Format with Prettier

# Database
bun run db:generate      # Generate database schema
bun run db:migrate       # Run database migrations
bun run db:studio        # Open database studio

# Docker Operations
bun run docker:build     # Build Docker images
bun run docker:up        # Start all Docker services
bun run docker:down      # Stop Docker services
bun run docker:logs      # Show Docker logs

# Deployment
bun run deploy:vps       # Deploy to VPS
```

#### Makefile Commands (Alternative Interface)

```bash
# Development
make dev                 # Start both servers
make dev/web             # Start frontend only
make dev/api             # Start backend only

# Testing
make test                # Run all tests
make test/web            # Frontend tests
make test/api            # Backend tests
make test/e2e            # End-to-end tests
make test/coverage       # Coverage reports

# Building
make build               # Build for production
make build/web           # Build frontend
make build/api           # Build backend

# Docker
make docker/up           # Start Docker services
make docker/down         # Stop Docker services
make docker/build        # Build Docker images
make docker/logs         # Show logs

# Database
make db/migrate          # Run migrations
make db/generate         # Generate schema
make db/studio           # Open database studio

# Deployment
make deploy/vps          # Deploy to VPS
```

#### Frontend Commands (apps/web directory)

```bash
# Development
bun run dev              # Start Astro development server
bun run build            # Build for production
bun run preview          # Preview production build

# Testing
bun run test             # Run unit tests
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with coverage

# Type Checking
bun run typecheck        # TypeScript type checking
```

### Project Structure

```
finance-manager/
├── apps/                         # Application code
│   ├── web/                      # Frontend (Astro + React + Bun)
│   │   ├── src/                  # Source code
│   │   │   ├── components/       # React components
│   │   │   ├── layouts/          # Astro layouts
│   │   │   └── pages/            # Astro pages
│   │   ├── public/               # Static assets
│   │   ├── tests/                # Test files
│   │   ├── coverage/             # Test coverage reports
│   │   ├── package.json          # Web app dependencies
│   │   ├── astro.config.mjs      # Astro configuration
│   │   ├── tsconfig.json         # TypeScript configuration
│   │   ├── Dockerfile            # Docker configuration
│   │   └── bun.lockb             # Bun lockfile
│   └── backend-shared/           # Shared types and utilities
│       ├── types/                # TypeScript types
│       └── utils/                # Shared utilities
├── backend/                      # Go backend API
│   ├── cmd/                      # Application entry points
│   │   └── main.go               # Main application
│   ├── internal/                 # Internal application code
│   │   ├── config/               # Configuration
│   │   ├── handlers/             # HTTP handlers
│   │   ├── middleware/           # HTTP middleware
│   │   ├── models/               # Data models
│   │   ├── repositories/         # Data access layer
│   │   ├── routes/               # Route definitions
│   │   └── services/             # Business logic
│   ├── pkg/                      # Public packages
│   │   ├── database/             # Database utilities
│   │   └── telemetry/            # Monitoring
│   ├── migrations/               # Database migrations
│   ├── go.mod                    # Go modules
│   ├── go.sum                    # Go module checksums
│   └── Dockerfile                # Docker configuration
├── infrastructure/               # Infrastructure configuration
│   ├── docker-compose.yml        # Docker compose
│   ├── docker-compose.override.yml
│   ├── Makefile                  # Build automation
│   ├── nginx/                    # Nginx configuration
│   │   ├── nginx.conf            # Reverse proxy config
│   │   └── ssl/                  # SSL certificates
│   └── redis/                    # Redis configuration
│       └── redis.conf            # Redis config file
├── scripts/                      # Deployment and utility scripts
│   ├── deployment/               # VPS deployment scripts
│   ├── dev/                      # Development scripts
│   ├── prod/                     # Production scripts
│   └── test/                     # Test scripts
├── docs/                         # Documentation
│   ├── PROJECT_STRUCTURE.md      # Project structure
│   ├── README.md                 # Main documentation
│   ├── API.md                    # API documentation
│   ├── SETUP.md                  # Setup guide
│   ├── USER_GUIDE.md             # User guide
│   └── PRODUCTION_DEPLOYMENT.md  # Production deployment
├── config/                       # Configuration files
│   ├── .env.example              # Environment template
│   ├── .env.development          # Development config
│   ├── .env.production           # Production config
│   ├── .oxlintrc.json            # Oxlint config
│   └── trae-settings.json        # Trae settings
├── package.json                  # Root package.json
├── bun.lockb                     # Bun lockfile
├── vitest*.config.ts             # Testing configurations
├── playwright*.config.ts         # E2E test configurations
└── archive/                      # Archived files
    ├── cloudflare-workers/       # Old Cloudflare files
    └── old-package-manager/      # Old pnpm files
```

## 🧪 Testing

The project maintains high test coverage with comprehensive testing at all levels across both the frontend and backend:

### Frontend Testing (Astro + React)

#### Test Types
- **Unit Tests**: Core business logic with Vitest
- **Component Tests**: React component testing with Testing Library
- **Integration Tests**: Full component integration testing
- **E2E Tests**: Full user workflows with Playwright
- **Coverage**: 80%+ line and branch coverage target

#### Test Configuration
- `vitest.config.ts` - Main Vitest configuration
- `vitest.coverage.config.ts` - Coverage reporting
- `vitest.react.config.ts` - React component testing
- `playwright.config.ts` - Full E2E configuration
- `playwright.minimal.config.ts` - Minimal E2E tests

#### Test Commands
```bash
# Run all tests
bun run test:all

# Run specific test types
bun run test:web      # Frontend tests
bun run test:api      # Backend tests
bun run test:e2e      # E2E tests
bun run test:coverage # Coverage reports

# Coverage and debugging
bun run test:coverage    # Run with coverage
bun run test:ui          # Interactive Vitest UI
bun run test:e2e:debug   # Debug E2E tests
```

### Backend Testing (Go API)

#### Test Types
- **Unit Tests**: Business logic and model testing
- **Integration Tests**: Database and external service testing
- **API Tests**: HTTP endpoint testing
- **Benchmark Tests**: Performance testing

#### Test Commands
```bash
# Run backend tests
bun run test:api

# From backend directory
go test ./...                    # Run all tests
go test -v ./internal/models     # Test specific package
go test -cover                   # Run with coverage
go test -bench=.                 # Run benchmarks
```

### Test Structure

```
tests/
├── unit/                        # Unit tests
│   ├── api/                     # API endpoint tests
│   ├── auth/                    # Authentication tests
│   ├── db/                      # Database tests
│   ├── lib/                     # Utility tests
│   └── components/              # Component tests
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

### Production Deployment (Docker + VPS)

#### Quick Deployment

```bash
# Deploy to VPS with one command
bun run deploy:vps
# Or using Makefile
make deploy/vps
```

#### Manual Deployment Steps

1. **Environment Setup**:
   ```bash
   # Configure environment variables
   cp config/.env.example config/.env
   # Edit with production values
   nano config/.env
   ```

2. **Docker Deployment**:
   ```bash
   # Build Docker images
   bun run docker:build
   
   # Start all services
   cd infrastructure
   docker-compose up -d
   ```

3. **Database Setup**:
   ```bash
   # Run database migrations
   bun run db:migrate
   
   # Verify database connection
   cd infrastructure
   docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT 1;"
   ```

#### VPS Deployment

The project includes automated VPS deployment:

```bash
# Deploy to VPS
./scripts/deployment/deploy.sh

# What the script does:
# 1. Builds Docker images
# 2. Creates deployment package
# 3. Uploads to VPS
# 4. Configures environment
# 5. Starts services
# 6. Cleans up old resources
```

#### Environment Configuration

The application supports multiple environments:

- **Development**: Local development with hot reload
- **Production**: Docker-based deployment with Nginx
- **Staging**: Production-like environment for testing

#### Environment Variables

Required variables for production:
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=finance_manager
DB_USER=finance_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password

# AI Services
OPENROUTER_API_KEY=your_openrouter_key
ANTHROPIC_API_KEY=your_anthropic_key
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
