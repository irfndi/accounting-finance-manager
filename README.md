# Finance Manager

A modern, AI-powered accounting platform built on Cloudflare Workers with industrial-grade CI/CD and comprehensive test coverage.

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Astro Islands, HTMX/Alpine)                                 │
│     ⬇ fetch/WS                                                        │
│  Cloudflare Worker (Hono router) ──▶  D1 (SQL, ACID)                  │
│        │                         ├─▶  R2 (files, receipts)            │
│        │                         ├─▶  KV (sessions, feature flags)    │
│        │                         ├─▶  Vectorize (doc embeddings)      │
│        │                         ├─▶  OpenRouter / CF-AI (LLM/OCR)    │
│        └─▶ AWS SES (mail)                                             │
└────────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🧮 Core Accounting Engine
- **Double-Entry Bookkeeping**: ACID-compliant transactions with automatic balance validation
- **Multi-Currency Support**: IDR primary with extensible currency system
- **Real-Time Financial Statements**: Balance Sheet, P&L, Cash Flow with live calculations
- **Account Management**: Hierarchical chart of accounts with type validation
- **Journal Entry System**: Comprehensive validation and audit trails

### 🤖 AI-Powered Features
- **Document OCR**: Cloudflare AI for receipt and invoice text extraction
- **Smart Categorization**: OpenRouter LLM for intelligent expense classification
- **Financial Analysis**: AI-driven insights and recommendations
- **Semantic Search**: Vectorize-powered document discovery

### 🔐 Security & Authentication
- **Magic Link Authentication**: Passwordless login via AWS SES
- **JWT Session Management**: HS256 signed tokens with KV storage
- **Argon2id Password Hashing**: Edge-optimized security
- **CSRF Protection**: OWASP-compliant token validation
- **Audit Logging**: Immutable transaction history

### 📊 Financial Reporting
- **Multi-Format Export**: CSV, PDF, Excel with professional formatting
- **Real-Time Calculations**: Live balance updates and statement generation
- **Performance Optimization**: Intelligent caching and query optimization
- **Compliance Ready**: Audit trails and regulatory reporting support

## 🚀 Technology Stack

### Runtime & Infrastructure
- **Cloudflare Workers**: Edge computing platform
- **Hono**: Fast, lightweight web framework
- **TypeScript**: Type-safe development
- **Astro**: Modern static site generator with islands architecture

### Data & Storage
- **Cloudflare D1**: SQLite-compatible serverless database
- **Drizzle ORM**: Type-safe SQL query builder
- **Cloudflare R2**: Object storage for files and receipts
- **Cloudflare KV**: Key-value store for sessions and cache
- **Cloudflare Vectorize**: Vector database for AI embeddings

### AI & Machine Learning
- **OpenRouter**: Primary LLM provider (qwen/qwen3-235b-a22b:free)
- **Moonshot AI**: Fallback provider (moonshotai/kimi-k2:free)
- **Cloudflare AI**: OCR and document processing

### Development & Testing
- **Vitest**: Fast unit testing framework with Miniflare
- **Playwright**: End-to-end testing
- **OxLint + Prettier**: Code quality and formatting
- **GitHub Actions**: CI/CD pipeline
- **pnpm**: Fast, efficient package manager
- **Alchemy**: Infrastructure-as-Code for Cloudflare

## 🛠️ Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Cloudflare account with Workers, D1, R2, KV, and Vectorize enabled

### Quick Start

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

### Available Commands

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

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio

# Deployment
pnpm deploy           # Deploy with Alchemy
pnpm deploy:prod      # Deploy to production
pnpm tail             # Stream development logs
```

### Project Structure

```
.
├── src/
│   ├── ai/                 # AI services and providers
│   ├── db/                 # Database schema and services
│   ├── lib/                # Shared utilities and business logic
│   ├── types/              # TypeScript type definitions
│   ├── web/                # Astro frontend application
│   │   ├── components/     # React components
│   │   ├── layouts/        # Astro layouts
│   │   ├── pages/          # Astro pages and routes
│   │   └── styles/         # CSS and Tailwind styles
│   └── worker/             # Cloudflare Worker application
│       ├── routes/         # API route handlers
│       ├── middleware/     # Worker middleware
│       ├── services.ts     # Worker services
│       └── index.ts        # Worker entry point
├── tests/unit/             # Unit tests
├── e2e/                    # End-to-end tests
├── migrations/             # Database migrations
├── docs/                   # Documentation
├── .trae/documents/        # Generated documentation
├── .taskmaster/            # Project management
├── alchemy.*.ts            # Infrastructure-as-Code configs
├── vitest.*.config.ts      # Testing configurations
└── playwright.*.config.ts  # E2E test configurations
```

## 🧪 Testing

The project maintains high test coverage with comprehensive testing at all levels:

### Test Types
- **Unit Tests**: Core business logic with Vitest
- **Workers Tests**: Cloudflare Workers runtime with Miniflare
- **React Tests**: Component testing with Testing Library
- **E2E Tests**: Full user workflows with Playwright
- **Coverage**: 80%+ line and branch coverage target

### Test Configuration
- `vitest.config.ts` - Main Vitest configuration for Workers
- `vitest.coverage.config.ts` - Coverage reporting
- `vitest.react.config.ts` - React component testing
- `playwright.config.ts` - Full E2E configuration
- `playwright.minimal.config.ts` - Minimal E2E tests

### Test Commands
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

### Test Structure
```
tests/unit/
├── worker/           # Worker-specific tests
├── api/              # API endpoint tests
├── auth/             # Authentication tests
├── db/               # Database tests
├── ai/               # AI service tests
└── lib/              # Utility tests

e2e/
├── auth.spec.ts      # Authentication flows
├── dashboard.spec.ts # Dashboard functionality
├── accounts.spec.ts  # Account management
└── transactions.spec.ts # Transaction processing
```

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

### Environment Configuration

The application supports multiple environments:

- **Development**: Local with Miniflare emulation
- **Staging**: Cloudflare Workers with staging resources
- **Production**: Full Cloudflare deployment

## 📊 Monitoring & Observability

- **Cloudflare Analytics**: Request metrics and performance monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Audit Trails**: Complete transaction and user activity logging
- **Performance Metrics**: Response times and resource utilization

## 🔧 Configuration

### AI Models

The application uses the following AI models:

- **Primary**: `qwen/qwen3-235b-a22b:free` (OpenRouter)
- **Fallback**: `moonshotai/kimi-k2:free` (Moonshot AI)
- **OCR**: Cloudflare AI models for document processing

### Database Schema

The application uses a double-entry accounting schema with:

- **Accounts**: Chart of accounts with hierarchical structure
- **Transactions**: Financial transactions with ACID compliance
- **Entries**: Individual debit/credit entries
- **Users**: Authentication and authorization
- **Audit Logs**: Immutable activity tracking

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

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` directory
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

## 🗺️ Roadmap

- [ ] Multi-tenant support
- [ ] Advanced reporting dashboard
- [ ] Mobile application
- [ ] Third-party integrations (banks, payment processors)
- [ ] Advanced AI features (predictive analytics, anomaly detection)
- [ ] Compliance modules (tax reporting, audit preparation)

---

**Built with ❤️ using Cloudflare Workers and modern web technologies**