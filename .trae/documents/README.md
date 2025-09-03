# Finance Manager

A modern, AI-powered corporate accounting platform built on Cloudflare Workers with industrial-grade CI/CD, comprehensive test coverage, and professional financial reporting capabilities.

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Astro Islands + React)                                      │
│     ⬇ fetch/API                                                       │
│  Cloudflare Worker (Hono router) ──▶  D1 (SQLite, ACID)              │
│        │                         ├─▶  R2 (files, receipts, exports)   │
│        │                         ├─▶  KV (sessions, cache, flags)     │
│        │                         ├─▶  Vectorize (document embeddings) │
│        │                         ├─▶  AI (OpenRouter/Cloudflare)      │
│        └─▶ AWS SES (email notifications)                              │
└────────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🧮 Core Accounting Engine

- **Double-Entry Bookkeeping**: ACID-compliant transactions with automatic balance validation
- **Multi-Currency Support**: IDR primary with extensible currency framework
- **Real-Time Financial Statements**: Balance Sheet, P&L, Cash Flow with live calculations
- **Hierarchical Chart of Accounts**: Type-validated account management with parent-child relationships
- **Journal Entry System**: Comprehensive validation, audit trails, and immutable transaction history
- **Multi-Entity Support**: Isolated accounting for multiple business entities
- **Period Management**: Flexible accounting periods with proper closing procedures

### 🤖 AI-Powered Features

- **Document OCR**: Cloudflare AI for receipt and invoice text extraction
- **Smart Categorization**: OpenRouter LLM for intelligent expense classification
- **Financial Analysis**: AI-driven insights and recommendations
- **Semantic Search**: Vectorize-powered document discovery and retrieval
- **Automated Data Entry**: AI-assisted transaction creation from documents

### 🔐 Security & Authentication

- **Magic Link Authentication**: Passwordless login via AWS SES
- **JWT Session Management**: HS256 signed tokens with KV storage
- **Argon2id Password Hashing**: Edge-optimized security with WebAssembly
- **CSRF Protection**: OWASP-compliant token validation
- **Audit Logging**: Immutable transaction history and user activity tracking
- **Role-Based Access Control**: Granular permissions for different user types

### 📊 Financial Reporting

- **Multi-Format Export**: CSV, PDF, Excel with professional formatting
- **Real-Time Calculations**: Live balance updates and statement generation
- **Performance Optimization**: Intelligent caching and query optimization
- **Compliance Ready**: Audit trails and regulatory reporting support
- **Custom Reports**: Flexible reporting engine with date range filtering
- **Dashboard Analytics**: Key performance indicators and financial metrics

## 🚀 Technology Stack

### Runtime & Infrastructure

- **Cloudflare Workers**: Edge computing platform with global distribution
- **Hono**: Fast, lightweight web framework with TypeScript support
- **TypeScript**: Type-safe development with strict configuration
- **Astro**: Modern static site generator with islands architecture
- **Alchemy**: Infrastructure as Code for Cloudflare resources

### Data & Storage

- **Cloudflare D1**: SQLite-compatible serverless database with ACID compliance
- **Drizzle ORM**: Type-safe SQL query builder with schema validation
- **Cloudflare R2**: Object storage for files, receipts, and report exports
- **Cloudflare KV**: Key-value store for sessions, cache, and feature flags
- **Cloudflare Vectorize**: Vector database for AI embeddings and semantic search

### AI & Machine Learning

- **OpenRouter**: Primary LLM provider with multiple model support
- **Moonshot AI**: Fallback provider for redundancy
- **Cloudflare AI**: OCR, document processing, and text analysis

### Development & Testing

- **Vitest**: Fast unit testing framework with Workers support
- **Playwright**: End-to-end testing with browser automation
- **ESLint (OxLint)**: Fast code linting and quality checks
- **GitHub Actions**: Comprehensive CI/CD pipeline
- **pnpm**: Fast, efficient package manager with workspace support

## 🛠️ Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- Cloudflare account with Workers, D1, R2, KV, and Vectorize enabled
- AWS account for SES email delivery

### Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd finance-manager
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Cloudflare and AWS credentials

# Start development server
make dev
```

### Available Commands

```bash
# Development
pnpm dev                     # Start Astro development server
pnpm dev:worker             # Start Worker development server with Alchemy
pnpm dev:all                # Start all development servers
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage report
pnpm test:ui                # Open Vitest UI for interactive testing
pnpm test:workers           # Run Cloudflare Workers tests
pnpm test:react             # Run React component tests
pnpm test:e2e               # Run end-to-end tests (minimal config)
pnpm test:e2e:headless      # Run E2E tests headless
pnpm test:e2e:headed        # Run E2E tests with browser UI
pnpm test:e2e:debug         # Debug E2E tests
pnpm test:all               # Run all test suites
pnpm test:ci                # Run tests for CI with coverage and JUnit output

# Database Management
pnpm db:generate            # Generate database migrations from schema
pnpm db:migrate             # Apply migrations to development database
pnpm db:migrate:prod        # Apply migrations to production database
pnpm db:studio              # Open Drizzle Studio (database GUI)
pnpm db:push                # Push schema changes directly to database
pnpm db:check               # Check migration consistency

# Code Quality
pnpm typecheck              # Run TypeScript type checking
pnpm lint                   # Run OxLint for code quality
pnpm lint:fix               # Fix linting issues automatically
pnpm format                 # Format code with Prettier

# Deployment
pnpm deploy                 # Deploy using Alchemy (development)
pnpm deploy:wrangler        # Deploy using Wrangler CLI
pnpm deploy:prod            # Deploy to production with Alchemy
pnpm deploy:prod:wrangler   # Deploy to production with Wrangler
pnpm destroy                # Destroy development infrastructure

# Monitoring & Debugging
pnpm tail                   # Stream development logs
pnpm tail:prod              # Stream production logs
pnpm types                  # Generate TypeScript types for Workers

# Utilities
pnpm clean                  # Clean build artifacts and caches
```

### Project Structure

```
finance-manager/
├── src/
│   ├── ai/                 # AI services and providers
│   │   ├── config.ts       # AI configuration and settings
│   │   ├── providers/      # OpenRouter, Cloudflare AI providers
│   │   ├── services/       # AI service layer and financial AI
│   │   ├── types.ts        # AI type definitions
│   │   └── index.ts        # AI module exports
│   ├── db/                 # Database layer
│   │   ├── schema/         # Drizzle schema definitions
│   │   ├── index.ts        # Database connection and exports
│   │   ├── raw-docs.ts     # Raw document handling
│   │   └── services.ts     # Database service layer
│   ├── lib/                # Shared utilities and business logic
│   │   ├── auth/           # Authentication utilities
│   │   ├── financial-reports.ts # Financial reporting logic
│   │   ├── index.ts        # Library exports
│   │   ├── index.worker.ts # Worker-specific utilities
│   │   └── index.worker.d.ts # Worker type definitions
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Global type exports
│   ├── web/                # Astro frontend application
│   │   ├── components/     # React components and UI elements
│   │   ├── layouts/        # Astro layout templates
│   │   ├── lib/            # Frontend-specific utilities
│   │   ├── pages/          # Astro pages and routes
│   │   └── styles/         # CSS and Tailwind styles
│   ├── worker/             # Cloudflare Worker application
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Worker middleware
│   │   ├── templates/      # Email and document templates
│   │   ├── utils/          # Worker-specific utilities
│   │   ├── services.ts     # Worker service layer
│   │   ├── types.ts        # Worker type definitions
│   │   └── index.ts        # Worker main entry point
│   ├── env.d.ts            # Environment type definitions
│   └── global.d.ts         # Global type declarations
├── tests/                  # Test suites
│   └── unit/               # Unit tests for all modules
├── e2e/                    # End-to-end tests
│   ├── config/             # E2E test configuration
│   ├── helpers/            # E2E test utilities
│   ├── *.spec.ts           # E2E test specifications
│   ├── setup.ts            # E2E setup configuration
│   └── teardown.ts         # E2E cleanup configuration
├── e2e-isolated/           # Isolated E2E tests
├── migrations/             # Database migration files
│   ├── *.sql               # Migration SQL files
│   └── meta/               # Migration metadata
├── docs/                   # Project documentation
│   ├── PRODUCTION_DEPLOYMENT.md
│   ├── REPOSITORY_SETUP.md
│   ├── ALCHEMY_INFRASTRUCTURE.md
│   └── *.md                # Additional documentation
├── .trae/documents/        # Generated documentation
├── .taskmaster/            # Project management and task tracking
├── .github/                # GitHub configuration
│   ├── workflows/          # CI/CD pipeline definitions
│   └── instructions/       # Development workflow guides
├── scripts/                # Build and deployment scripts
│   ├── dev/                # Development scripts
│   ├── prod/               # Production scripts
│   └── test/               # Testing scripts
├── public/                 # Static assets
├── functions/              # Cloudflare Functions (if used)
├── alchemy.*.ts            # Alchemy Infrastructure-as-Code configs
├── vitest.*.config.ts      # Vitest testing configurations
├── playwright.*.config.ts  # Playwright E2E configurations
├── wrangler.jsonc          # Wrangler configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── astro.config.mjs        # Astro build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Project dependencies and scripts
└── Makefile                # Development workflow automation
```

## 🧪 Testing

The project maintains comprehensive test coverage with multiple testing strategies:

### Test Types

- **Unit Tests**: Core business logic, utilities, and service functions
- **Integration Tests**: Database operations and API endpoint testing
- **End-to-End Tests**: Complete user workflows with Playwright
- **Workers Tests**: Cloudflare Workers runtime with Miniflare simulation
- **React Component Tests**: UI component testing with Testing Library
- **Coverage Target**: 80%+ line and branch coverage

### Test Configuration Files

- `vitest.config.ts` - Main Vitest configuration for Workers tests
- `vitest.coverage.config.ts` - Coverage-specific configuration
- `vitest.react.config.ts` - React component testing configuration
- `playwright.config.ts` - Full Playwright configuration
- `playwright.minimal.config.ts` - Minimal E2E test configuration

### Test Commands

```bash
# Unit and Integration Tests
pnpm test                   # Run all unit tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with detailed coverage report
pnpm test:ui                # Open interactive Vitest UI
pnpm test:workers           # Run Cloudflare Workers-specific tests
pnpm test:react             # Run React component tests
pnpm test:ci                # Run tests for CI with JUnit output

# End-to-End Tests
pnpm test:e2e               # Run E2E tests (minimal config)
pnpm test:e2e:headless      # Run E2E tests without browser UI
pnpm test:e2e:headed        # Run E2E tests with visible browser
pnpm test:e2e:debug         # Debug E2E tests step by step
pnpm test:e2e:report        # View E2E test results report
pnpm test:e2e:install       # Install Playwright browsers

# Comprehensive Testing
pnpm test:all               # Run all test suites (unit + E2E)

# Specific Test Files
vitest run tests/unit/specific-test.ts
playwright test e2e/auth.spec.ts
```

### Test Structure

#### Unit Tests (`tests/unit/`)

- **Business Logic**: Accounting engine, financial calculations
- **Services**: AI services, authentication, database operations
- **Utilities**: Helper functions, validation, formatting
- **API Routes**: Worker route handlers and middleware

#### E2E Tests (`e2e/`)

- **Authentication Flow**: Login, logout, session management
- **Dashboard**: Main application interface and navigation
- **Accounts Management**: Chart of accounts CRUD operations
- **Transaction Processing**: Journal entries and financial transactions
- **Reporting**: Financial report generation and export

#### Test Environment

- **Miniflare**: Simulates Cloudflare Workers runtime locally
- **Happy DOM**: Fast DOM implementation for unit tests
- **Testing Library**: React component testing utilities
- **Playwright**: Cross-browser automation for E2E tests
- **Coverage**: V8 and Istanbul providers for detailed coverage analysis

## 🚀 Deployment

### Production Deployment

1. **Configure Cloudflare Resources**:

   ```bash
   # Create D1 database
   wrangler d1 create finance-manager-prod

   # Create KV namespace
   wrangler kv:namespace create "SESSIONS" --env production

   # Create R2 bucket
   wrangler r2 bucket create finance-manager-uploads

   # Create Vectorize index
   wrangler vectorize create finance-documents --dimensions=1536
   ```

2. **Set Environment Variables**:

   ```bash
   # Set secrets
   wrangler secret put JWT_SECRET --env production
   wrangler secret put OPENROUTER_API_KEY --env production
   wrangler secret put AWS_SES_ACCESS_KEY --env production
   wrangler secret put AWS_SES_SECRET_KEY --env production
   ```

3. **Deploy Database Migrations**:

   ```bash
   pnpm db:migrate:prod
   ```

4. **Deploy Application**:
   ```bash
   pnpm deploy:prod
   ```

### Environment Configuration

The application supports multiple environments:

- **Development**: Local with Miniflare emulation
- **Staging**: Cloudflare Workers with staging resources
- **Production**: Full Cloudflare deployment with production resources

### Infrastructure as Code

The project uses Alchemy for declarative infrastructure management:

- `alchemy.dev.ts`: Development environment with local bindings
- `alchemy.prod.ts`: Production environment with remote resources
- `alchemy.run.ts`: Main deployment orchestration script
- `wrangler.jsonc`: Legacy Wrangler configuration for fallback deployment
- `wrangler.test.jsonc`: Test environment configuration for CI/CD

## 📊 Monitoring & Observability

- **Cloudflare Analytics**: Request metrics and performance monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Audit Trails**: Complete transaction and user activity logging
- **Performance Metrics**: Response times and resource utilization
- **Log Streaming**: Real-time log monitoring with `wrangler tail`

## 🔧 Configuration

### Environment Variables

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# AI Services
OPENROUTER_API_KEY=your_openrouter_key
MOONSHOT_API_KEY=your_moonshot_key

# AWS SES
AWS_SES_ACCESS_KEY=your_ses_access_key
AWS_SES_SECRET_KEY=your_ses_secret_key
AWS_SES_REGION=us-east-1

# Application
JWT_SECRET=your_jwt_secret
APP_URL=https://your-domain.com
```

### Configuration Files

The project uses multiple configuration files for different aspects:

#### Infrastructure Configuration

- `wrangler.jsonc`: Primary Cloudflare Workers configuration
- `wrangler.test.jsonc`: Test environment configuration
- `alchemy.*.ts`: Infrastructure-as-Code definitions

#### Build and Development

- `astro.config.mjs`: Astro framework configuration
- `tsconfig.json`: TypeScript compiler configuration
- `drizzle.config.ts`: Database ORM configuration
- `tailwindcss.config.js`: CSS framework configuration

#### Testing Configuration

- `vitest.config.ts`: Main testing framework configuration
- `vitest.coverage.config.ts`: Coverage reporting configuration
- `vitest.react.config.ts`: React component testing
- `playwright.config.ts`: E2E testing configuration
- `playwright.minimal.config.ts`: Minimal E2E configuration

#### Code Quality

- `.oxlintrc.json`: OxLint configuration for fast linting
- `prettier.config.js`: Code formatting configuration
- `.github/workflows/`: CI/CD pipeline definitions

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- `PRODUCTION_DEPLOYMENT.md`: Production deployment guide
- `REPOSITORY_SETUP.md`: Repository setup and configuration
- `ALCHEMY_INFRASTRUCTURE.md`: Infrastructure as Code documentation
- `AGENTS.md`: AI agent configuration and usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

### Development Workflow

1. Use the Taskmaster system for project management
2. Follow the established coding standards
3. Write tests for new features
4. Update documentation as needed
5. Use conventional commits for clear history

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the documentation in the `docs/` directory
2. Review existing issues in the repository
3. Create a new issue with detailed information
4. Follow the issue template for bug reports or feature requests

---

**Finance Manager** - Professional accounting made simple with modern technology.
