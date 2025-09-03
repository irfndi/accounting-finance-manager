# Finance Manager Setup and Installation Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Options](#installation-options)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Cloud Services Setup](#cloud-services-setup)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## System Requirements

### Development Environment

**Operating System:**
- Windows 10/11 (WSL2 recommended)
- macOS 10.15+
- Ubuntu 20.04+ or equivalent

**Node.js:**
- Version 18.x or higher
- npm 8.x or higher

**Docker:**
- Docker Desktop 4.0+
- Docker Compose 2.0+

**Additional Tools:**
- Git 2.0+
- VS Code or similar IDE
- Cloudflare CLI (wrangler)

### Production Environment

**Cloudflare Account:**
- Workers subscription
- R2 storage bucket
- D1 database
- KV storage
- Vectorize index (beta)

**Email Service:**
- AWS SES (recommended)
- SendGrid (alternative)
- SMTP server (custom)

**Monitoring:**
- Cloudflare Analytics
- Prometheus/Grafana (optional)
- Error tracking service

## Installation Options

### Option 1: Local Development Setup

#### Prerequisites

1. **Install Node.js**
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Or download from https://nodejs.org
   ```

2. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop
   - Start Docker Desktop after installation

3. **Install Cloudflare CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

#### Clone Repository

```bash
git clone https://github.com/your-username/finance-manager.git
cd finance-manager
```

### Option 2: Cloud Development Setup

#### Cloudflare Workers Dashboard

1. Create Cloudflare account at https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Create new Worker service
4. Connect to GitHub repository
5. Configure build settings

#### VS Code Remote Development

1. Install VS Code
2. Install Remote Development extension pack
3. Connect to cloud environment
4. Develop in cloud workspace

### Option 3: Docker Development Setup

#### Quick Start with Docker Compose

```bash
# Clone repository
git clone https://github.com/your-username/finance-manager.git
cd finance-manager

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f
```

## Development Setup

### Frontend Setup (Astro + React)

#### Install Dependencies

```bash
cd src
npm install
```

#### Environment Configuration

```bash
# Create environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Environment Variables:**
```env
# API Configuration
PUBLIC_API_BASE_URL=http://localhost:8787
PUBLIC_APP_URL=http://localhost:4321

# Authentication
PUBLIC_AUTH_PROVIDER=magic-link
PUBLIC_ENABLE_SIGNUP=true

# Analytics (optional)
PUBLIC_ENABLE_ANALYTICS=false
PUBLIC_ANALYTICS_ID=

# Feature Flags
PUBLIC_ENABLE_AI_FEATURES=true
PUBLIC_ENABLE_BULK_IMPORT=true
PUBLIC_ENABLE_EXPORT=true
```

#### Development Server

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup (Cloudflare Workers)

#### Install Dependencies

```bash
cd src/worker
npm install
```

#### Environment Configuration

```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables:**
```env
# Database
DATABASE_URL=your-database-url
DATABASE_AUTH_TOKEN=your-auth-token

# Cloudflare Services
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# R2 Storage
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# D1 Database
D1_DATABASE_ID=your-database-id

# KV Storage
KV_NAMESPACE_ID=your-kv-namespace-id

# Vectorize
VECTORIZE_INDEX_NAME=your-vector-index

# Email Service
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REGION=us-east-1

# AI Services
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
PERPLEXITY_API_KEY=your-perplexity-key

# JWT Secret
JWT_SECRET=your-jwt-secret

# Environment
ENVIRONMENT=development
```

#### Local Development

```bash
# Start local development server
npm run dev

# Run tests
npm run test

# Deploy to Cloudflare
npm run deploy
```

### Go Backend Setup (Optional)

#### Prerequisites

```bash
# Install Go
# Download from https://golang.org/dl/

# Verify installation
go version
```

#### Setup Go Backend

```bash
cd backend
go mod download
go mod tidy

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Go Environment Variables:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=finance_user
DB_PASSWORD=your_password
DB_NAME=finance_manager
DB_SSL_MODE=disable

# Server
SERVER_PORT=8080
SERVER_HOST=0.0.0.0

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### Run Go Backend

```bash
# Run development server
go run main.go

# Build binary
go build -o finance-manager main.go

# Run tests
go test ./...

# Run with hot reload (requires air)
go install github.com/cosmtrek/air@latest
air
```

## Production Deployment

### Cloudflare Workers Deployment

#### Prerequisites

1. **Cloudflare Account Setup**
   ```bash
   # Login to Cloudflare
   wrangler login
   
   # Create KV namespace
   wrangler kv:namespace create FINANCE_MANAGER_CACHE
   
   # Create D1 database
   wrangler d1 create finance-manager-db
   
   # Create R2 bucket
   wrangler r2 bucket create finance-manager-docs
   ```

2. **Configure Wrangler**
   ```toml
   # wrangler.toml
   name = "finance-manager"
   main = "src/worker/index.ts"
   compatibility_date = "2024-01-01"
   
   [env.production]
   vars = { ENVIRONMENT = "production" }
   kv_namespaces = [
     { binding = "FINANCE_MANAGER_CACHE", id = "your-kv-id" }
   ]
   d1_databases = [
     { binding = "FINANCE_MANAGER_DB", database_id = "your-d1-id", database_name = "finance-manager" }
   ]
   r2_buckets = [
     { binding = "FINANCE_MANAGER_DOCS", bucket_name = "finance-manager-docs" }
   ]
   
   [[env.production.vectorize]]
   binding = "VECTORIZE_INDEX"
   index_name = "finance-manager-index"
   ```

#### Deployment Process

```bash
# Build frontend
cd src
npm run build

# Deploy to Cloudflare Pages (if using Pages for frontend)
npm run deploy:pages

# Deploy backend worker
cd src/worker
npm run deploy

# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put SES_ACCESS_KEY_ID
wrangler secret put SES_SECRET_ACCESS_KEY
```

### Go Backend Production Deployment

#### Docker Deployment

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o finance-manager main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/finance-manager .
COPY --from=builder /app/.env ./

EXPOSE 8080
CMD ["./finance-manager"]
```

#### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - ENVIRONMENT=production
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finance_manager
      POSTGRES_USER: finance_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  postgres_data:
  grafana_data:
```

#### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finance-manager
  template:
    metadata:
      labels:
        app: finance-manager
    spec:
      containers:
      - name: app
        image: your-registry/finance-manager:latest
        ports:
        - containerPort: 8080
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Frontend Deployment

#### Static Hosting Options

**Cloudflare Pages:**
```bash
# Build frontend
cd src
npm run build

# Deploy to Pages
npm run deploy:pages
```

**Netlify:**
```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel:**
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Configuration

### Environment Configuration

#### Development Configuration

```yaml
# config/development.yaml
app:
  name: "Finance Manager Dev"
  debug: true
  cors:
    enabled: true
    origins: ["http://localhost:4321"]
  
database:
  type: "sqlite"
  url: "file:./dev.db"
  
auth:
  jwt_secret: "dev-secret-key"
  token_expiry: "24h"
  
email:
  provider: "console" # Log emails to console
  
ai:
  enabled: true
  provider: "openai"
  model: "gpt-3.5-turbo"
```

#### Production Configuration

```yaml
# config/production.yaml
app:
  name: "Finance Manager"
  debug: false
  cors:
    enabled: true
    origins: ["https://app.yourdomain.com"]
  
database:
  type: "postgres"
  url: "${DATABASE_URL}"
  pool_size: 20
  
auth:
  jwt_secret: "${JWT_SECRET}"
  token_expiry: "168h" # 7 days
  
email:
  provider: "ses"
  region: "us-east-1"
  from_email: "noreply@yourdomain.com"
  
ai:
  enabled: true
  provider: "openrouter"
  model: "anthropic/claude-3-sonnet"
  
monitoring:
  enabled: true
  metrics_port: 9090
  error_tracking: true
```

### Feature Flags

#### Feature Flag Configuration

```yaml
# config/features.yaml
features:
  ai_categorization:
    enabled: true
    users: ["premium", "business"]
  
  ocr_processing:
    enabled: true
    rate_limit: 100 # per hour
  
  bulk_import:
    enabled: true
    max_file_size: 10485760 # 10MB
  
  export_reports:
    enabled: true
    formats: ["pdf", "csv", "excel"]
  
  multi_currency:
    enabled: false # Coming soon
  
  team_collaboration:
    enabled: false # Coming soon
```

### Database Configuration

#### SQLite Configuration (Development)

```bash
# Initialize SQLite database
sqlite3 dev.db < schema.sql

# Run migrations
npm run migrate:up

# Seed database
npm run seed
```

#### PostgreSQL Configuration (Production)

```sql
-- Create database and user
CREATE DATABASE finance_manager;
CREATE USER finance_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finance_manager TO finance_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Database Migrations

```sql
-- migrations/001_initial_schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Cloud Services Setup

### Cloudflare Services

#### Workers Configuration

```javascript
// src/worker/index.ts
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Main application
    return handleRequest(request, env);
  }
};
```

#### D1 Database Setup

```bash
# Create D1 database
wrangler d1 create finance-manager-db

# Run migrations
wrangler d1 execute finance-manager-db --file=./migrations/001_initial_schema.sql

# Execute queries
wrangler d1 execute finance-manager-db --command="SELECT * FROM users LIMIT 10"
```

#### R2 Storage Configuration

```javascript
// Configure R2 in worker
const R2_BUCKET = env.FINANCE_MANAGER_DOCS;

// Upload file
async function uploadFile(file, key) {
  await R2_BUCKET.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });
}

// Generate signed URL
async function getSignedUrl(key) {
  return await R2_BUCKET.sign(key, {
    expiresIn: 3600, // 1 hour
  });
}
```

#### KV Storage Setup

```javascript
// Configure KV in worker
const CACHE = env.FINANCE_MANAGER_CACHE;

// Cache user sessions
async function cacheSession(userId, session) {
  await CACHE.put(`session:${userId}`, JSON.stringify(session), {
    expirationTtl: 86400, // 24 hours
  });
}

// Rate limiting
async function checkRateLimit(userId) {
  const key = `rate_limit:${userId}:${Date.now() / 60000 | 0}`;
  const current = await CACHE.get(key) || 0;
  
  if (current >= 100) {
    throw new Error('Rate limit exceeded');
  }
  
  await CACHE.put(key, parseInt(current) + 1, {
    expirationTtl: 60, // 1 minute
  });
}
```

#### Vectorize Configuration

```javascript
// Configure Vectorize for semantic search
const VECTOR_INDEX = env.VECTORIZE_INDEX;

// Generate embeddings
async function generateEmbeddings(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });
  
  return await response.json();
}

// Vector search
async function vectorSearch(query, topK = 10) {
  const embeddings = await generateEmbeddings(query);
  
  return await VECTOR_INDEX.query(embeddings.data[0].embedding, {
    topK,
    returnValues: true,
    returnMetadata: true,
  });
}
```

### Email Service Setup

#### AWS SES Configuration

```bash
# Create SES identity
aws ses verify-email-identity --email-address noreply@yourdomain.com

# Create SMTP credentials
aws ses create-smtp-credentials --identity noreply@yourdomain.com

# Set environment variables
export SES_ACCESS_KEY_ID=your-access-key
export SES_SECRET_ACCESS_KEY=your-secret-key
export SES_REGION=us-east-1
```

#### Email Templates

```javascript
// Configure email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to Finance Manager!',
    template: 'welcome-email.html'
  },
  magicLink: {
    subject: 'Your login link for Finance Manager',
    template: 'magic-link.html'
  },
  budgetAlert: {
    subject: 'Budget Alert: {{category}} at {{percentage}}%',
    template: 'budget-alert.html'
  }
};
```

### AI Services Setup

#### OpenAI Configuration

```javascript
// Configure OpenAI
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Transaction categorization
async function categorizeTransaction(description, amount, merchant) {
  const prompt = `
    Categorize this transaction:
    Description: ${description}
    Amount: ${amount}
    Merchant: ${merchant}
    
    Categories: Food, Transportation, Housing, Utilities, Entertainment, Shopping, Healthcare, Other
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });
  
  return response.choices[0].message.content;
}
```

#### OCR Configuration

```javascript
// Configure OCR processing
async function processOCR(imageBuffer) {
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer]));
  formData.append('model', 'receipt-ocr');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  return await response.json();
}
```

## Testing

### Frontend Testing

#### Unit Testing

```bash
# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### E2E Testing

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

#### Component Testing Example

```typescript
// src/components/__tests__/TransactionForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionForm } from '../TransactionForm';

test('renders transaction form', () => {
  render(<TransactionForm onSubmit={jest.fn()} />);
  
  expect(screen.getByLabelText('Description')).toBeInTheDocument();
  expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
});

test('submits form with valid data', () => {
  const mockSubmit = jest.fn();
  render(<TransactionForm onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Test Transaction' }
  });
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: '100' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
    description: 'Test Transaction',
    amount: 100
  });
});
```

### Backend Testing

#### Worker Testing

```bash
# Install test dependencies
npm install --save-dev @cloudflare/vitest-pool-workers vitest

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

#### Integration Testing

```typescript
// src/worker/__tests__/transactions.test.ts
import { createTestContext } from '../test-utils';
import { handleTransaction } from '../transactions';

describe('Transactions API', () => {
  let env: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    const context = createTestContext();
    env = context.env;
    ctx = context.ctx;
  });

  test('creates transaction successfully', async () => {
    const request = new Request('https://example.com/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test Transaction',
        amount: 100,
        type: 'expense'
      })
    });

    const response = await handleTransaction(request, env, ctx);
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.transaction).toBeDefined();
  });
});
```

### Load Testing

#### k6 Configuration

```javascript
// k6/script.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
};

export default function () {
  let response = http.post('https://api.yourdomain.com/api/transactions', {
    description: 'Load test transaction',
    amount: Math.random() * 1000,
    type: 'expense'
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'transaction created': (r) => JSON.parse(r.body).success === true,
  });
}
```

#### Run Load Test

```bash
# Install k6
https://k6.io/docs/get-started/installation/

# Run load test
k6 run k6/script.js

# Run with cloud output
k6 cloud k6/script.js
```

## Troubleshooting

### Common Issues

#### Installation Issues

**Issue:** Node.js version conflicts
```bash
# Check current Node version
node --version

# Use nvm to switch versions
nvm use 18

# Clear npm cache
npm cache clean --force
```

**Issue:** Docker not starting
```bash
# Check Docker status
docker info

# Restart Docker service
# macOS/Linux
sudo systemctl restart docker

# Windows
Restart-Service docker
```

#### Development Issues

**Issue:** Port already in use
```bash
# Find process using port
lsof -i :4321  # macOS/Linux
netstat -ano | findstr :4321  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Issue:** Environment variables not loading
```bash
# Verify .env file exists
ls -la .env

# Check file permissions
chmod 600 .env

# Load environment variables manually
export $(cat .env | xargs)
```

#### Database Issues

**Issue:** Database connection failed
```bash
# Check database service status
docker-compose ps

# View database logs
docker-compose logs db

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

**Issue:** Migration failures
```bash
# Rollback migrations
npm run migrate:down

# Check migration syntax
sqlite3 dev.db ".schema"

# Manual database reset
rm -f dev.db
npm run migrate:up
```

#### Cloudflare Issues

**Issue:** Wrangler authentication failed
```bash
# Logout and re-login
wrangler logout
wrangler login

# Check authentication status
wrangler whoami

# Update wrangler
npm install -g wrangler@latest
```

**Issue:** Deployment failures
```bash
# Check wrangler configuration
wrangler config list

# Test deployment locally
wrangler dev

# Check build logs
wrangler deployments list
```

#### Performance Issues

**Issue:** Slow API responses
```bash
# Check worker logs
wrangler tail

# Monitor metrics
wrangler metrics

# Test with different regions
wrangler dev --local --port 8080
```

**Issue:** Memory leaks
```bash
# Monitor memory usage
wrangler dev --memory-limit 512

# Profile memory usage
# Add memory profiling to worker
```

### Debugging

#### Local Debugging

```javascript
// Add debug logging
console.log('Debug:', { request, env });

// Use Chrome DevTools
// Add breakpoint in worker code
debugger;
```

#### Remote Debugging

```bash
# Enable remote debugging
wrangler dev --inspect

# Connect Chrome DevTools
# Navigate to chrome://inspect
```

#### Error Tracking

```javascript
// Add error tracking
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      console.error('Request failed:', error);
      
      // Send to error tracking service
      await sendErrorToTracking(error, request);
      
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
```

### Getting Help

#### Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Astro Documentation](https://docs.astro.build/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

#### Community Support

- [GitHub Issues](https://github.com/your-username/finance-manager/issues)
- [Stack Overflow](https://stackoverflow.com/)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Discord Server](https://discord.gg/your-server)

#### Professional Support

For enterprise support:
- Email: enterprise@yourdomain.com
- SLA: 24/7 support
- Features: Dedicated account manager, priority support

---

*This setup guide provides comprehensive instructions for installing and configuring the Finance Manager application. For the latest updates and additional resources, please visit our documentation website.*