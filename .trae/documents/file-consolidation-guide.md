# File Consolidation and Cleanup Guide

## 1. Overview

This document provides a comprehensive guide for consolidating and cleaning up the Finance Manager project during the refactoring process. The goal is to eliminate unnecessary files, merge redundant configurations, and reorganize the project structure while preserving all essential information.

## 2. Current Project Analysis

### 2.1 Redundant Agent Configuration Directories

The project currently contains multiple agent configuration directories that serve similar purposes:

```
.clinerules/          # Cline AI agent rules
.cursor/              # Cursor AI agent rules  
.roo/                 # Roo AI agent rules
.windsurf/            # Windsurf AI agent rules
.trae/                # Trae AI agent rules
.taskmaster/          # Taskmaster project management
.kiro/                # Kiro AI agent settings
```

**Action**: Consolidate into single `.ai-agents/` directory

### 2.2 Cloudflare-Specific Files (To Remove)

```
alchemy.dev.ts        # Alchemy development config
alchemy.prod.ts       # Alchemy production config
alchemy.run.ts        # Alchemy runtime config
wrangler.jsonc        # Cloudflare Workers config
wrangler.jsonc.backup # Backup of Workers config
wrangler.test.jsonc   # Test Workers config
worker-configuration.d.ts # Workers TypeScript definitions
```

**Action**: Remove all Cloudflare Workers related files

### 2.3 Package Manager Files (To Replace)

```
package.json          # Convert to Bun-compatible
pnpm-lock.yaml        # Remove (replace with bun.lockb)
pnpm-workspace.yaml   # Remove (not needed for monorepo)
```

**Action**: Migrate to Bun package management

### 2.4 Test Configuration Files (To Consolidate)

```
vitest.config.ts      # Main Vitest config
vitest.config.ts.bak  # Backup config
vitest.coverage.config.ts # Coverage config
vitest.react.config.ts    # React testing config
playwright.config.ts      # E2E config
playwright.minimal.config.ts # Minimal E2E config
```

**Action**: Consolidate into unified testing configuration

## 3. File Consolidation Plan

### 3.1 Phase 1: Remove Obsolete Files

#### 3.1.1 Cloudflare Workers Files
```bash
# Files to delete
rm alchemy.dev.ts
rm alchemy.prod.ts
rm alchemy.run.ts
rm wrangler.jsonc
rm wrangler.jsonc.backup
rm wrangler.test.jsonc
rm worker-configuration.d.ts
```

#### 3.1.2 Package Manager Files
```bash
# Files to delete
rm pnpm-lock.yaml
rm pnpm-workspace.yaml
```

#### 3.1.3 Redundant Configuration Files
```bash
# Files to delete
rm vitest.config.ts.bak
rm .windsurfrules
rm .roomodes
rm context7.json
rm trae-settings.json
rm wt-settings.json
```

#### 3.1.4 Lighthouse CI Files (Development artifacts)
```bash
# Remove lighthouse reports and artifacts
rm -rf .lighthouseci/
rm lighthouserc.cjs
```

### 3.2 Phase 2: Consolidate Agent Configurations

#### 3.2.1 Create Unified Agent Directory
```bash
# Create new consolidated directory
mkdir -p .ai-agents/rules
mkdir -p .ai-agents/templates
mkdir -p .ai-agents/settings
```

#### 3.2.2 Merge Agent Rules
```bash
# Consolidate all agent rules into single files
# Global rules (common to all agents)
cat .clinerules/cline_rules.md \
    .cursor/rules/cursor_rules.mdc \
    .roo/rules/roo_rules.md \
    .trae/rules/trae_rules.md \
    > .ai-agents/rules/global-rules.md

# Development workflow rules
cat .clinerules/dev_workflow.md \
    .cursor/rules/dev_workflow.mdc \
    .roo/rules/dev_workflow.md \
    .trae/rules/dev_workflow.md \
    .windsurf/rules/dev_workflow.md \
    > .ai-agents/rules/dev-workflow.md

# Self-improvement rules
cat .clinerules/self_improve.md \
    .roo/rules/self_improve.md \
    .trae/rules/self_improve.md \
    .windsurf/rules/self_improve.md \
    > .ai-agents/rules/self-improvement.md

# Taskmaster rules
cat .clinerules/taskmaster.md \
    .cursor/rules/taskmaster.mdc \
    .roo/rules/taskmaster.md \
    .trae/rules/taskmaster.md \
    .windsurf/rules/taskmaster.md \
    > .ai-agents/rules/taskmaster.md
```

#### 3.2.3 Consolidate Agent Settings
```bash
# Merge configuration files
cp .taskmaster/config.json .ai-agents/settings/taskmaster-config.json
cp .kiro/settings/mcp.json.example .ai-agents/settings/mcp-config.example.json
```

#### 3.2.4 Remove Original Agent Directories
```bash
# Remove original directories after consolidation
rm -rf .clinerules/
rm -rf .cursor/
rm -rf .roo/
rm -rf .windsurf/
rm -rf .taskmaster/
rm -rf .kiro/
# Keep .trae/ for current document generation
```

### 3.3 Phase 3: Reorganize Project Structure

#### 3.3.1 Create New Directory Structure
```bash
# Backend structure
mkdir -p backend/cmd/server
mkdir -p backend/cmd/migrate
mkdir -p backend/internal/api
mkdir -p backend/internal/auth
mkdir -p backend/internal/database
mkdir -p backend/internal/services
mkdir -p backend/pkg/utils
mkdir -p backend/pkg/models
mkdir -p backend/migrations
mkdir -p backend/configs

# Frontend structure
mkdir -p frontend/src/components
mkdir -p frontend/src/pages
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/utils
mkdir -p frontend/src/types
mkdir -p frontend/public

# Infrastructure
mkdir -p infrastructure/docker
mkdir -p infrastructure/nginx
mkdir -p infrastructure/postgres
mkdir -p infrastructure/redis

# Documentation
mkdir -p docs/api
mkdir -p docs/deployment
mkdir -p docs/development

# Scripts
mkdir -p scripts/deployment
mkdir -p scripts/development
mkdir -p scripts/maintenance
```

#### 3.3.2 Move Existing Files
```bash
# Move source files
mv src/web/* frontend/src/
mv src/worker/* backend/internal/api/
mv src/db/* backend/internal/database/
mv src/lib/* backend/pkg/utils/
mv src/types/* backend/pkg/models/
mv src/ai/* backend/internal/services/ai/

# Move migrations
mv migrations/* backend/migrations/

# Move documentation
mv docs/* docs/development/
mv README.md docs/README.md

# Move scripts
mv scripts/* scripts/development/
```

### 3.4 Phase 4: Consolidate Configuration Files

#### 3.4.1 Testing Configuration
```typescript
// tests/vitest.config.ts (unified configuration)
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../backend'),
      '@frontend': resolve(__dirname, '../frontend/src'),
    },
  },
});
```

#### 3.4.2 Linting Configuration
```json
// .oxlintrc.json (consolidated)
{
  "rules": {
    "typescript": "error",
    "react": "error",
    "jsx-a11y": "warn",
    "import": "error"
  },
  "env": {
    "browser": true,
    "node": true,
    "es2022": true
  },
  "ignorePatterns": [
    "dist/",
    "build/",
    "node_modules/",
    "*.min.js",
    "backend/migrations/"
  ]
}
```

#### 3.4.3 TypeScript Configuration
```json
// tsconfig.json (root configuration)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  },
  "references": [
    { "path": "./frontend" },
    { "path": "./tests" }
  ]
}
```

## 4. Package.json Migration

### 4.1 New Package.json Structure
```json
{
  "name": "finance-manager",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "description": "Corporate Finance Manager - Dockerized Go backend with React frontend",
  "workspaces": [
    "frontend",
    "tests"
  ],
  "scripts": {
    "dev": "docker-compose -f docker-compose.yml -f docker-compose.override.yml up",
    "dev:frontend": "cd frontend && bun run dev",
    "dev:backend": "cd backend && go run cmd/server/main.go",
    "build": "bun run build:frontend && bun run build:backend",
    "build:frontend": "cd frontend && bun run build",
    "build:backend": "cd backend && go build -o bin/server cmd/server/main.go",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:build": "docker-compose build",
    "deploy": "./scripts/deployment/deploy.sh",
    "backup": "./scripts/maintenance/backup.sh",
    "migrate": "cd backend && go run cmd/migrate/main.go"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "oxlint": "^0.9.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.0.0"
  }
}
```

### 4.2 Frontend Package.json
```json
{
  "name": "finance-manager-frontend",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "oxlint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.300.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.0.0"
  }
}
```

## 5. Documentation Consolidation

### 5.1 Merge Documentation Files
```bash
# Create comprehensive documentation structure
mkdir -p docs/architecture
mkdir -p docs/api
mkdir -p docs/deployment
mkdir -p docs/development
mkdir -p docs/user-guide

# Consolidate existing docs
cat docs/AGENTS.md docs/CLAUDE.md > docs/development/ai-agents.md
cat docs/ALCHEMY_INFRASTRUCTURE.md > docs/architecture/legacy-infrastructure.md
cat docs/PRODUCTION_DEPLOYMENT.md > docs/deployment/legacy-deployment.md
cat docs/REPOSITORY_SETUP.md > docs/development/setup.md

# Create new documentation index
cat > docs/README.md << 'EOF'
# Finance Manager Documentation

## Architecture
- [System Architecture](./architecture/system-architecture.md)
- [Database Design](./architecture/database-design.md)
- [API Design](./architecture/api-design.md)

## Development
- [Development Setup](./development/setup.md)
- [Docker Development](./development/docker.md)
- [Testing Guide](./development/testing.md)
- [AI Agents](./development/ai-agents.md)

## Deployment
- [Production Deployment](./deployment/production.md)
- [Digital Ocean Setup](./deployment/digital-ocean.md)
- [Monitoring](./deployment/monitoring.md)

## API Reference
- [Authentication API](./api/authentication.md)
- [Financial API](./api/financial.md)
- [Document API](./api/documents.md)

## User Guide
- [Getting Started](./user-guide/getting-started.md)
- [Features Overview](./user-guide/features.md)
- [Troubleshooting](./user-guide/troubleshooting.md)
EOF
```

### 5.2 Update README.md
```markdown
# Finance Manager

A modern, containerized financial management application with Go backend and React frontend.

## 🏗️ Architecture

- **Backend**: Go with Gin framework
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL in Docker
- **Cache**: Redis in Docker
- **Reverse Proxy**: Nginx
- **Deployment**: Digital Ocean Droplet with Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Bun (for frontend development)
- Go 1.21+ (for backend development)

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd finance-manager

# Start development environment
bun run dev

# Or start individual services
bun run dev:frontend  # Frontend only
bun run dev:backend   # Backend only
```

### Production Deployment
```bash
# Deploy to Digital Ocean
bun run deploy
```

## 📚 Documentation

See [docs/README.md](./docs/README.md) for comprehensive documentation.

## 🧪 Testing

```bash
bun test              # Run all tests
bun test:coverage     # Run with coverage
bun test:e2e          # Run E2E tests
```

## 📁 Project Structure

```
.
├── backend/          # Go backend application
├── frontend/         # React frontend application
├── infrastructure/   # Docker and deployment configs
├── docs/            # Documentation
├── scripts/         # Deployment and utility scripts
└── tests/           # Test configurations and utilities
```
```

## 6. Cleanup Verification

### 6.1 Files Removed Checklist
- [ ] Cloudflare Workers configurations
- [ ] pnpm specific files
- [ ] Redundant agent directories
- [ ] Backup and temporary files
- [ ] Development artifacts
- [ ] Lighthouse CI files

### 6.2 Files Consolidated Checklist
- [ ] Agent configurations merged
- [ ] Test configurations unified
- [ ] Documentation reorganized
- [ ] Package.json migrated to Bun
- [ ] TypeScript configurations updated
- [ ] Linting configurations consolidated

### 6.3 New Structure Verification
- [ ] Backend directory structure created
- [ ] Frontend directory structure created
- [ ] Infrastructure configurations in place
- [ ] Documentation properly organized
- [ ] Scripts directory structured
- [ ] Docker configurations ready

## 7. Migration Script

### 7.1 Automated Cleanup Script
```bash
#!/bin/bash
# scripts/cleanup-migration.sh

set -e

echo "🧹 Starting Finance Manager cleanup and consolidation..."

# Phase 1: Remove obsolete files
echo "📦 Phase 1: Removing obsolete files..."
rm -f alchemy.*.ts wrangler.*.jsonc worker-configuration.d.ts
rm -f pnpm-lock.yaml pnpm-workspace.yaml
rm -f vitest.config.ts.bak .windsurfrules .roomodes
rm -f context7.json trae-settings.json wt-settings.json
rm -rf .lighthouseci/ lighthouserc.cjs

# Phase 2: Create new structure
echo "🏗️ Phase 2: Creating new directory structure..."
mkdir -p backend/{cmd/{server,migrate},internal/{api,auth,database,services},pkg/{utils,models},migrations,configs}
mkdir -p frontend/{src/{components,pages,hooks,services,utils,types},public}
mkdir -p infrastructure/{docker,nginx,postgres,redis}
mkdir -p docs/{api,deployment,development,user-guide,architecture}
mkdir -p scripts/{deployment,development,maintenance}
mkdir -p .ai-agents/{rules,templates,settings}

# Phase 3: Consolidate agent configurations
echo "🤖 Phase 3: Consolidating agent configurations..."
if [ -d .clinerules ]; then
    cat .clinerules/*.md > .ai-agents/rules/consolidated-rules.md 2>/dev/null || true
fi
if [ -d .taskmaster ]; then
    cp .taskmaster/config.json .ai-agents/settings/taskmaster-config.json 2>/dev/null || true
fi

# Phase 4: Move source files
echo "📁 Phase 4: Moving source files..."
if [ -d src/web ]; then
    cp -r src/web/* frontend/src/ 2>/dev/null || true
fi
if [ -d src/worker ]; then
    cp -r src/worker/* backend/internal/api/ 2>/dev/null || true
fi
if [ -d migrations ]; then
    cp -r migrations/* backend/migrations/ 2>/dev/null || true
fi

# Phase 5: Clean up old directories
echo "🗑️ Phase 5: Cleaning up old directories..."
rm -rf .clinerules .cursor .roo .windsurf .taskmaster .kiro

echo "✅ Cleanup and consolidation completed!"
echo "📋 Next steps:"
echo "  1. Review consolidated files in .ai-agents/"
echo "  2. Update package.json for Bun compatibility"
echo "  3. Set up Docker configurations"
echo "  4. Test new project structure"
```

## 8. Post-Cleanup Validation

### 8.1 Structure Validation Script
```bash
#!/bin/bash
# scripts/validate-structure.sh

echo "🔍 Validating new project structure..."

# Check required directories
REQUIRED_DIRS=(
    "backend/cmd/server"
    "backend/internal/api"
    "frontend/src/components"
    "infrastructure/docker"
    "docs/development"
    "scripts/deployment"
    ".ai-agents/rules"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir exists"
    else
        echo "❌ $dir missing"
    fi
done

# Check for removed files
OBSOLETE_FILES=(
    "alchemy.dev.ts"
    "wrangler.jsonc"
    "pnpm-lock.yaml"
    ".clinerules"
)

for file in "${OBSOLETE_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "✅ $file removed"
    else
        echo "❌ $file still exists"
    fi
done

echo "📊 Directory sizes:"
du -sh backend/ frontend/ infrastructure/ docs/ scripts/ .ai-agents/ 2>/dev/null || true

echo "🎯 Validation complete!"
```

This file consolidation guide provides a systematic approach to cleaning up and reorganizing the Finance Manager project, eliminating redundancy while preserving all essential information and functionality.
