# Finance Manager - Go + Astro + Bun Stack

## Project Structure

```
finance-manager/
├── apps/                    # Application code
│   ├── web/                # Frontend (Astro + React + Bun 1.2.21)
│   │   ├── src/            # Source code
│   │   │   ├── components/ # React components
│   │   │   ├── layouts/    # Astro layouts
│   │   │   └── pages/      # Astro pages
│   │   ├── public/         # Static assets
│   │   ├── tests/          # Test files
│   │   ├── coverage/       # Test coverage reports
│   │   ├── package.json    # Web app dependencies
│   │   ├── astro.config.mjs # Astro configuration
│   │   ├── tsconfig.json   # TypeScript configuration
│   │   ├── Dockerfile      # Docker configuration
│   │   ├── nginx.conf      # Nginx configuration
│   │   └── bun.lockb       # Bun lockfile
│   └── backend-shared/     # Shared backend types and utilities
│       ├── types/          # TypeScript types shared between frontend and backend
│       └── utils/          # Shared utility functions
├── backend/                # Go backend API
│   ├── cmd/                # Application entry points
│   │   └── main.go         # Main application entry point
│   ├── internal/           # Internal application code
│   │   ├── config/         # Configuration management
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── middleware/     # HTTP middleware
│   │   ├── models/         # Data models and structures
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # Route definitions
│   │   └── services/       # Business logic services
│   ├── pkg/                # Public packages
│   │   ├── database/       # Database connection and utilities
│   │   └── telemetry/      # Monitoring and observability
│   ├── migrations/         # Database migrations
│   ├── drizzle.config.ts   # Database configuration
│   ├── go.mod              # Go modules
│   ├── go.sum              # Go module checksums
│   ├── Dockerfile          # Docker configuration
│   └── README.md           # Backend-specific documentation
├── infrastructure/         # Infrastructure configuration
│   ├── docker-compose.yml  # Docker compose configuration
│   ├── docker-compose.override.yml
│   ├── Makefile           # Build automation
│   ├── nginx/             # Nginx configuration
│   │   ├── nginx.conf     # Production reverse proxy config
│   │   └── ssl/           # SSL certificates and setup
│   └── redis/             # Redis configuration
│       └── redis.conf     # Redis configuration file
├── scripts/                # Deployment and utility scripts
│   ├── deployment/        # VPS deployment scripts
│   │   └── deploy.sh      # Main deployment script
│   ├── dev/               # Development scripts
│   ├── prod/              # Production scripts
│   ├── test/              # Test scripts
│   └── migration/         # Migration scripts
├── docs/                   # Documentation
│   ├── PROJECT_STRUCTURE.md    # This file
│   ├── PROJECT_FIXES_SUMMARY.md # Project fixes summary
│   ├── README.md               # Main documentation
│   ├── API.md                  # API documentation
│   ├── SETUP.md                # Setup guide
│   ├── USER_GUIDE.md           # User guide
│   ├── PRODUCTION_DEPLOYMENT.md # Production deployment guide
│   ├── RESTRUCTURING_SUMMARY.md # Restructuring summary
│   ├── REPOSITORY_SETUP.md     # Repository setup
│   ├── AGENTS.md               # AI agents documentation
│   ├── CLAUDE.md               # Claude Code integration
│   ├── ALCHEMY_*.md           # Alchemy infrastructure docs
│   ├── api/                   # API documentation
│   ├── deployment/            # Deployment documentation
│   └── development/           # Development documentation
├── config/                 # Configuration files
│   ├── .env.example       # Environment variables template
│   ├── .env.development   # Development environment
│   ├── .env.production    # Production environment
│   ├── .oxlintrc.json      # Oxlint configuration
│   ├── .yamllint           # YAML linting
│   └── trae-settings.json  # Trae settings
├── package.json            # Root package.json with shared scripts
├── bun.lockb              # Bun lockfile for root dependencies
├── vitest*.config.ts      # Testing configurations
├── playwright*.config.ts   # E2E testing configurations
└── archive/                # Archived files
    ├── cloudflare-workers/ # Old Cloudflare Workers files
    ├── old-package-manager/ # Old pnpm files
    ├── old-configs/        # Old configuration files
    ├── old-dirs/           # Old directories
    └── old-frontend/       # Old src directory
```

## Development

### Prerequisites
- **Node.js**: 18+ (for some tools)
- **Bun**: 1.2.21+ (primary package manager and runtime)
- **Go**: 1.21+ (backend development)
- **Docker**: 20.10+ (containerization)
- **PostgreSQL**: 15+ (database)
- **Redis**: 7+ (caching)

### Quick Start

#### Install Dependencies
```bash
# Install all dependencies for both frontend and backend
bun run install:all

# Or install individually
bun install                    # Root dependencies
cd apps/web && bun install     # Frontend dependencies
```

#### Development Servers

##### Frontend Only (Astro + React)
```bash
# Start Astro development server
bun run dev:web
# Or using Makefile
make dev/web
```
- **URL**: http://localhost:3000
- **Hot Reload**: Enabled
- **TypeScript**: Enabled with strict mode

##### Backend Only (Go API)
```bash
# Start Go API server
bun run dev:api
# Or using Makefile
make dev/api
```
- **URL**: http://localhost:8080
- **Hot Reload**: Enabled via Air
- **Database**: PostgreSQL connection required

##### Full Development (Both Frontend and Backend)
```bash
# Start both servers concurrently
bun run dev
# Or using Makefile
make dev
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

#### Building for Production
```bash
# Build frontend
bun run build
# Or using Makefile
make build

# Build backend
bun run build:api
# Or using Makefile
make build/api
```

### Docker Development

#### Start All Services
```bash
# Start all services (PostgreSQL, Redis, Nginx, Frontend, Backend)
cd infrastructure
docker-compose up -d
# Or using root script
bun run docker:up
# Or using Makefile
make docker/up
```

#### Individual Services
```bash
# Build Docker images
bun run docker:build
# Or using Makefile
make docker/build

# View logs
bun run docker:logs
# Or using Makefile
make docker/logs

# Stop services
bun run docker:down
# Or using Makefile
make docker/down
```

### Database Operations

#### Migrations
```bash
# Run database migrations
bun run db:migrate
# Or using Makefile
make db/migrate

# Generate database schema
bun run db:generate
# Or using Makefile
make db/generate

# Open database studio (if available)
bun run db:studio
# Or using Makefile
make db/studio
```

### Code Quality

#### Linting and Formatting
```bash
# Run linter
bun run lint
# Or using Makefile
make lint

# Fix linting issues
bun run lint:fix
# Or using Makefile
make lint/fix

# Format code
bun run format
# Or using Makefile
make format
```

### Deployment

#### VPS Deployment
```bash
# Deploy to VPS
bun run deploy:vps
# Or using Makefile
make deploy/vps

# Prepare deployment package
make deploy/prepare
```

## Migration History

This project has been migrated from Cloudflare Workers to a modern Go + Astro + Bun stack:

### Previous Architecture (Archived)
- **Frontend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 + KV
- **Package Manager**: pnpm

### Current Architecture
- **Frontend**: Astro + React + Bun
- **Backend**: Go API
- **Database**: PostgreSQL
- **Cache**: Redis
- **Package Manager**: Bun
- **Deployment**: Docker + VPS

**Archived Files**: The old Cloudflare Workers files have been moved to `archive/cloudflare-workers/` for reference.

## Technology Stack

### Frontend Stack
- **Framework**: Astro 5.12.8 (with React islands)
- **Language**: TypeScript 5.9.2
- **Runtime**: Bun 1.2.21+
- **Styling**: Tailwind CSS 4.1.11
- **Components**: Radix UI + Lucide React
- **Testing**: Vitest 3.2.4 + Testing Library + Playwright
- **Build Tool**: Astro build system

### Backend Stack
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP router)
- **Database**: PostgreSQL 15+ with Drizzle ORM
- **Cache**: Redis 7+
- **Authentication**: JWT-based
- **Testing**: Go testing toolkit
- **Hot Reload**: Air for development

### Development Stack
- **Package Manager**: Bun 1.2.21+
- **Code Quality**: Oxlint + Prettier
- **Testing**: Vitest (frontend) + Go test (backend)
- **E2E Testing**: Playwright
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Deployment**: VPS with Docker

### Key Features
- **Dual-stack architecture**: Astro frontend + Go backend
- **Full TypeScript coverage**: Strict type safety
- **Comprehensive testing**: Unit, integration, and E2E tests
- **Modern tooling**: Fast builds with Bun, hot reload
- **Production ready**: Docker deployment with Nginx
- **Developer experience**: Excellent DX with comprehensive tooling

## Project Configuration

### Environment Variables
The project uses multiple environment files:
- `config/.env.example` - Template with all required variables
- `config/.env.development` - Development environment
- `config/.env.production` - Production environment

### Key Configuration Files
- `infrastructure/docker-compose.yml` - Docker services configuration
- `infrastructure/Makefile` - Development automation
- `infrastructure/nginx/nginx.conf` - Reverse proxy configuration
- `infrastructure/redis/redis.conf` - Redis configuration
- `scripts/deployment/deploy.sh` - VPS deployment script
- `package.json` (root) - Shared scripts and dependencies
- `apps/web/package.json` - Frontend-specific dependencies
- `backend/go.mod` - Backend Go modules

### Documentation Structure
- `docs/README.md` - Main documentation
- `docs/SETUP.md` - Setup guide
- `docs/API.md` - API documentation
- `docs/USER_GUIDE.md` - User documentation
- `docs/PRODUCTION_DEPLOYMENT.md` - Production deployment guide
- `docs/PROJECT_STRUCTURE.md` - This file