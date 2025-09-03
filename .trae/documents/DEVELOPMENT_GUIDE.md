# Finance Manager - Development Guide

## Overview

This guide provides comprehensive instructions for setting up, developing, and maintaining the Finance Manager application. The project uses a modern tech stack with Cloudflare Workers, Astro frontend, and TypeScript throughout.

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **pnpm**: v9.0.0 or higher (package manager)
- **Git**: Latest version
- **Wrangler CLI**: v3.84.0 or higher
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

- TypeScript and JavaScript Language Features
- Astro
- Tailwind CSS IntelliSense
- OxLint (replaces ESLint)
- Prettier - Code formatter
- GitLens
- Thunder Client (for API testing)
- Vitest (for testing)
- Playwright Test for VS Code

### Cloudflare Account Setup

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Generate an API token with Workers permissions
3. Note your Account ID from the dashboard

## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd finance-manager

# Install dependencies
pnpm install

# Install Wrangler CLI globally (if not already installed)
pnpm add -g wrangler@latest

# Install Playwright browsers for E2E testing
pnpm test:e2e:install
```

### 2. Environment Configuration

```bash
# Login to Cloudflare
wrangler login

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# CLOUDFLARE_API_TOKEN=your_api_token
# CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 3. Database Setup

```bash
# Create development database
wrangler d1 create finance-manager-db-dev

# Generate database schema from code
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio to view database
pnpm db:studio
```

### 4. Development Resources

```bash
# Create KV namespace for caching
wrangler kv:namespace create "FINANCE_MANAGER_CACHE"

# Create R2 bucket for documents
wrangler r2 bucket create finance-manager-documents-dev
```

## Development Workflow

### Starting Development

```bash
# Start the Astro development server
pnpm dev

# Start the Worker development server with Alchemy
pnpm dev:worker

# Start all development servers simultaneously
pnpm dev:all

# This runs:
# - Astro dev server on http://localhost:4321
# - Worker dev server on http://localhost:8787
# - TypeScript compilation in watch mode
```

### Available Commands

#### Development

```bash
pnpm dev              # Start Astro development server
pnpm dev:worker       # Start Worker development server with Alchemy
pnpm dev:all          # Start all development servers
pnpm build            # Build for production
pnpm preview          # Preview production build
```

#### Database

```bash
pnpm db:generate      # Generate database migrations from schema
pnpm db:migrate       # Apply migrations to development database
pnpm db:migrate:prod  # Apply migrations to production database
pnpm db:studio        # Open Drizzle Studio (database GUI)
pnpm db:push          # Push schema changes directly to database
pnpm db:check         # Check migration consistency
```

#### Testing

```bash
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with detailed coverage report
pnpm test:ui          # Open interactive Vitest UI
pnpm test:workers     # Run Cloudflare Workers-specific tests
pnpm test:react       # Run React component tests
pnpm test:e2e         # Run E2E tests (minimal config)
pnpm test:e2e:headless # Run E2E tests without browser UI
pnpm test:e2e:headed  # Run E2E tests with visible browser
pnpm test:e2e:debug   # Debug E2E tests step by step
pnpm test:all         # Run all test suites (unit + E2E)
pnpm test:ci          # Run tests for CI with JUnit output
```

#### Code Quality

```bash
pnpm typecheck        # Run TypeScript type checking
pnpm lint             # Run OxLint for code quality
pnpm lint:fix         # Fix linting issues automatically
pnpm format           # Format code with Prettier
```

#### Deployment

```bash
pnpm deploy           # Deploy using Alchemy (development)
pnpm deploy:wrangler  # Deploy using Wrangler CLI
pnpm deploy:prod      # Deploy to production with Alchemy
pnpm deploy:prod:wrangler # Deploy to production with Wrangler
pnpm destroy          # Destroy development infrastructure
```

#### Monitoring & Debugging

```bash
pnpm tail             # Stream development logs
pnpm tail:prod        # Stream production logs
pnpm types            # Generate TypeScript types for Workers
```

#### Utilities

```bash
pnpm clean            # Clean build artifacts and caches
```

## Project Structure

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
├── .trae/documents/        # Generated documentation
├── .taskmaster/            # Project management and task tracking
├── .github/                # GitHub configuration
│   ├── workflows/          # CI/CD pipeline definitions
│   └── instructions/       # Development workflow guides
├── scripts/                # Build and deployment scripts
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

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow OxLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns
- Use strict TypeScript configuration
- Follow consistent naming conventions

### Component Development

- Use React for interactive components
- Follow Astro's island architecture
- Implement proper error boundaries
- Use TypeScript interfaces for props
- Follow accessibility best practices

### API Development

- Use Hono framework for routing
- Implement proper error handling
- Add input validation with Zod
- Follow RESTful conventions
- Document APIs with OpenAPI/Swagger

### Database Development

- Use Drizzle ORM for type-safe queries
- Create migrations for schema changes
- Follow double-entry accounting principles
- Implement proper indexing
- Use transactions for data consistency

## Testing Strategy

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for 80%+ code coverage
- Use Vitest for testing framework
- Use Miniflare for Workers runtime simulation
- Use Happy DOM for fast DOM testing

### Integration Tests

- Test API endpoints with real database
- Test component integration with React Testing Library
- Use test database for isolation
- Mock external services (AI, email)
- Test Workers with proper bindings

### End-to-End Tests

- Test complete user workflows
- Use Playwright for browser automation
- Test across different browsers
- Include accessibility testing

### Test Configuration

#### Vitest Configuration Files

- `vitest.config.ts` - Main Vitest configuration for Workers tests
- `vitest.coverage.config.ts` - Coverage-specific configuration
- `vitest.react.config.ts` - React component testing configuration

#### Playwright Configuration Files

- `playwright.config.ts` - Full Playwright configuration
- `playwright.minimal.config.ts` - Minimal E2E test configuration

#### Test Environment Setup

- **Workers Tests**: Use Miniflare for Worker environment simulation
- **React Tests**: Use Happy DOM with Testing Library
- **Coverage**: V8 and Istanbul providers with 80% thresholds
- **Setup**: Custom setup files for different environments

#### Test Files Structure

```bash
tests/unit/
├── worker/                 # Worker-specific tests
├── api/                    # API endpoint tests
├── auth/                   # Authentication tests
├── db/                     # Database tests
├── ai/                     # AI service tests
└── lib/                    # Utility function tests

e2e/
├── auth.spec.ts            # Authentication flow tests
├── dashboard.spec.ts       # Dashboard functionality tests
├── accounts.spec.ts        # Account management tests
├── transactions.spec.ts    # Transaction processing tests
└── reports.spec.ts         # Financial reporting tests
```

## Debugging

### Development Debugging

```bash
# View Worker logs
pnpm tail

# Debug with Wrangler
wrangler tail --env development

# Debug database queries
pnpm db:studio

# Open Vitest UI for interactive debugging
pnpm test:ui

# Debug E2E tests step by step
pnpm test:e2e:debug
```

### Production Debugging

```bash
# View production logs
wrangler tail --env production

# Check Worker status
wrangler whoami

# List resources
wrangler d1 list
wrangler kv:namespace list
wrangler r2 bucket list
```

### Common Issues

#### Build Errors

- Check TypeScript errors: `pnpm typecheck`
- Verify dependencies: `pnpm install`
- Clear cache: `pnpm clean`
- Check OxLint issues: `pnpm lint`

#### Database Issues

- Check migrations: `pnpm db:check`
- Apply migrations: `pnpm db:migrate`
- Verify schema: `pnpm db:studio`
- Push schema changes: `pnpm db:push`

#### Worker Issues

- Check bindings in `wrangler.jsonc` or `alchemy.*.ts`
- Verify environment variables
- Check Cloudflare dashboard for errors
- Test with Miniflare: `pnpm test:workers`

## Performance Optimization

### Frontend Optimization

- Use Astro's partial hydration
- Optimize images with Astro's image service
- Implement code splitting
- Use service workers for caching

### Worker Optimization

- Minimize bundle size
- Use efficient database queries
- Implement proper caching strategies
- Optimize cold start performance

### Database Optimization

- Use appropriate indexes
- Optimize query patterns
- Implement connection pooling
- Monitor query performance

## Security Best Practices

### Authentication

- Use magic link authentication
- Implement JWT with proper expiration
- Store sessions securely in KV
- Validate all user inputs

### Data Protection

- Encrypt sensitive data
- Use HTTPS everywhere
- Implement CORS properly
- Follow OWASP guidelines

### Infrastructure Security

- Use environment variables for secrets
- Implement rate limiting
- Monitor for vulnerabilities
- Keep dependencies updated

## Deployment Process

### Development Deployment

1. Run tests: `pnpm test`
2. Build project: `pnpm build`
3. Deploy: `pnpm deploy`
4. Verify deployment: Check health endpoint

### Production Deployment

1. Create pull request
2. Pass all CI checks
3. Get code review approval
4. Merge to main branch
5. Automatic deployment via GitHub Actions
6. Monitor deployment logs

### Rollback Procedure

```bash
# Quick rollback
wrangler rollback --env production

# Or deploy previous version
git checkout <previous-commit>
pnpm deploy:prod
```

## Monitoring and Observability

### Available Monitoring

- Cloudflare Analytics dashboard
- Worker logs via `wrangler tail`
- Health check endpoint: `/health`
- Performance metrics in Cloudflare dashboard

### Key Metrics

- Request rate and response times
- Error rates and types
- Database query performance
- Memory and CPU usage
- User engagement metrics

## Contributing

### Git Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push branch: `git push origin feature/description`
4. Create pull request
5. Address review feedback
6. Merge after approval

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

## Resources

### Documentation

- [Astro Documentation](https://docs.astro.build/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vitest Testing](https://vitest.dev/)

### Tools

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Playwright Test Runner](https://playwright.dev/)

---

**Last Updated**: December 2024  
**Version**: 1.0.0
