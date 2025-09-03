# 🚀 Development Workflow Guide

## Finance Manager - Development Workflow

This guide provides a comprehensive overview of the development workflow for the Finance Manager project, covering everything from initial setup to deployment.

## 📋 Development Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows (with WSL2)
- **Bun**: 1.2.21+ (primary package manager and runtime)
- **Go**: 1.21+ (backend development)
- **Node.js**: 18+ (for some development tools)
- **Docker**: 20.10+ (containerization)
- **Git**: Latest version

### IDE Recommendations

- **Frontend**: VS Code with TypeScript and Astro extensions
- **Backend**: VS Code with Go extensions
- **Database**: DBeaver or pgAdmin for PostgreSQL
- **Git**: GitKraken or command line

## 🏗️ Project Setup

### 1. Clone and Install

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

### 2. Environment Configuration

```bash
# Copy environment template
cp config/.env.example config/.env

# Edit environment variables
nano config/.env

# Required configurations:
# - Database (PostgreSQL)
# - Redis
# - JWT secret
# - Email/SMTP
# - AI API keys
```

### 3. Database Setup

#### Option A: Docker (Recommended)

```bash
# Start database services
cd infrastructure
docker-compose up -d postgres redis

# Run migrations
bun run db:migrate
```

#### Option B: Local Installation

```bash
# Install PostgreSQL locally
# Create database
createdb finance_manager
createuser finance_user

# Install Redis locally
# Start Redis server
redis-server

# Run migrations
bun run db:migrate
```

## 🔄 Daily Development Workflow

### Morning Setup

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
bun run install:all

# Start development servers
bun run dev
```

### Development Commands

#### Frontend Development

```bash
# Start Astro development server
bun run dev:web

# Run frontend tests
bun run test:web

# Build frontend
bun run build

# Type checking
bun run typecheck
```

#### Backend Development

```bash
# Start Go API server
bun run dev:api

# Run backend tests
bun run test:api

# Build backend
bun run build:api

# Database operations
bun run db:migrate
bun run db:generate
```

#### Full Stack Development

```bash
# Start both frontend and backend
bun run dev

# Run all tests
bun run test:all

# Build both frontend and backend
bun run build && bun run build:api
```

### Code Quality

```bash
# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Run all quality checks
bun run lint && bun run format && bun run test:all
```

## 🧪 Testing Workflow

### Test Types and Structure

```
tests/
├── unit/                     # Unit tests
│   ├── components/          # React component tests
│   ├── api/                 # API endpoint tests
│   ├── lib/                 # Utility function tests
│   └── integration/         # Integration tests
├── e2e/                      # End-to-end tests
│   ├── auth.spec.ts         # Authentication flows
│   ├── dashboard.spec.ts    # Dashboard functionality
│   └── transactions.spec.ts # Transaction management
└── backend/                 # Backend tests
    ├── handlers/            # Handler tests
    ├── services/            # Service tests
    ├── models/              # Model tests
    └── integration/         # Backend integration tests
```

### Running Tests

#### Frontend Tests

```bash
# Run unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run component tests
bun run test:components

# Run integration tests
bun run test:integration
```

#### Backend Tests

```bash
# Run all backend tests
bun run test:api

# Run specific backend test packages
cd backend
go test ./internal/handlers
go test ./internal/services
go test ./internal/models

# Run tests with coverage
go test -cover ./...

# Run benchmark tests
go test -bench=. ./...
```

#### End-to-End Tests

```bash
# Run E2E tests
bun run test:e2e

# Run E2E tests headed
bun run test:e2e:headed

# Run E2E tests in debug mode
bun run test:e2e:debug

# Generate E2E test report
bun run test:e2e:report
```

### Test Best Practices

1. **Write tests before code** (TDD approach)
2. **Keep tests isolated** - no external dependencies
3. **Use meaningful test names** - describe what is being tested
4. **Test both happy path and error cases**
5. **Maintain test coverage** - aim for 80%+ coverage
6. **Run tests frequently** - after every significant change

## 🐛 Debugging Workflow

### Frontend Debugging

```bash
# Start development server with debugging
bun run dev:web

# Open browser dev tools
# - React DevTools extension
# - Network tab for API calls
# - Console for errors
# - Sources tab for debugging

# Run tests in debug mode
bun run test:ui
```

### Backend Debugging

```bash
# Start Go server with debugging
cd backend
dlv debug cmd/main.go

# Or use Air for hot reload with debugging
air

# Check logs
docker-compose logs -f backend

# Database debugging
docker-compose exec postgres psql -U finance_user -d finance_manager
```

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT 1;"
```

#### Redis Connection Issues
```bash
# Check Redis status
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### Port Conflicts
```bash
# Check what's running on ports
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill processes if needed
kill -9 <PID>
```

## 🚀 Git Workflow

### Branch Strategy

```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/auth-system # Feature branches
├── feature/dashboard
├── bugfix/login-issue
└── hotfix/security-patch
```

### Commit Convention

```bash
# Format: <type>(<scope>): <description>

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code formatting
# refactor: Code refactoring
# test: Test changes
# chore: Maintenance tasks

# Examples:
feat(auth): add JWT token refresh functionality
fix(api): handle database connection timeouts
docs(readme): update installation instructions
test(auth): add unit tests for login functionality
```

### Daily Git Workflow

```bash
# Start your day
git pull origin main
git checkout -b feature/your-feature-name

# Work on your feature
# ... make changes ...

# Stage and commit frequently
git add .
git commit -m "feat(auth): add user registration"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Wait for review and CI/CD
```

### Pull Request Process

1. **Create PR** from feature branch to develop
2. **Run tests** locally before pushing
3. **Update documentation** if needed
4. **Request review** from team members
5. **Address feedback** and make changes
6. **Merge** after approval

## 🐳 Docker Development Workflow

### Development with Docker

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker-compose down -v
```

### Building and Testing

```bash
# Build Docker images
docker-compose build

# Run tests in Docker
docker-compose run --rm backend go test ./...
docker-compose run --rm frontend bun test

# Access running containers
docker-compose exec backend bash
docker-compose exec frontend bash
```

## 📦 Deployment Workflow

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] Documentation is updated
- [ ] Database migrations are tested
- [ ] Environment variables are configured
- [ ] Security scan is clean

### Deployment Process

```bash
# Build for production
bun run build
bun run build:api

# Test production build
bun run test:all

# Deploy to VPS
bun run deploy:vps

# Verify deployment
curl https://yourdomain.com/health
```

### Rollback Process

```bash
# Quick rollback
git checkout <previous-working-commit>
bun run deploy:vps

# Database rollback if needed
docker-compose exec postgres pg_dump -U finance_user finance_manager > backup.sql
```

## 📊 Monitoring and Observability

### Development Monitoring

```bash
# Check application health
curl http://localhost:3000/health
curl http://localhost:8080/health

# Monitor resource usage
docker stats

# Check logs
docker-compose logs -f
```

### Performance Monitoring

```bash
# Frontend performance
# - Use Chrome DevTools Lighthouse
# - Monitor network requests
# - Check bundle size

# Backend performance
# - Monitor response times
# - Check database query performance
# - Monitor memory usage
```

## 🔄 Code Review Process

### Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
- [ ] Error handling is comprehensive
- [ ] No sensitive information is exposed

### Review Best Practices

1. **Be constructive** and provide specific feedback
2. **Focus on the code**, not the person
3. **Suggest improvements** rather than just pointing out issues
4. **Acknowledge good work** and positive aspects
5. **Be timely** with your reviews

## 📚 Documentation Workflow

### Documentation Standards

- Keep README files up to date
- Document API endpoints and their parameters
- Include code examples for complex features
- Use consistent formatting and style
- Update documentation before merging features

### Documentation Tasks

```bash
# Update documentation after changes
# - Update README.md if needed
# - Update API.md for new endpoints
# - Update PROJECT_STRUCTURE.md for structural changes
# - Update deployment guides
```

## 🎯 Best Practices

### Code Quality

1. **TypeScript**: Use strict mode and comprehensive typing
2. **Go**: Follow Go conventions and best practices
3. **Testing**: Maintain high test coverage
4. **Linting**: Run linter before committing
5. **Formatting**: Use Prettier for consistent formatting

### Performance

1. **Frontend**: Optimize bundle size and loading times
2. **Backend**: Use database indexes and query optimization
3. **Caching**: Implement Redis caching where appropriate
4. **Database**: Use connection pooling and proper indexing

### Security

1. **Authentication**: Use JWT tokens with proper expiration
2. **Authorization**: Implement proper role-based access control
3. **Input Validation**: Validate all user inputs
4. **Environment Variables**: Never commit secrets to version control

## 🚀 Conclusion

This development workflow provides a comprehensive guide for contributing to the Finance Manager project. Following these guidelines ensures code quality, maintainability, and smooth collaboration among team members.

Remember to:

- **Communicate** with your team regularly
- **Document** your changes thoroughly
- **Test** your code extensively
- **Review** code carefully
- **Learn** continuously and improve the process

---

**Last Updated**: 2025-09-03  
**Next Review**: 2025-12-03