# Alchemy Infrastructure Management

This project uses [Alchemy](https://alchemy.run/) for Infrastructure-as-Code management of Cloudflare resources.

## Overview

Alchemy provides a TypeScript-first approach to managing Cloudflare infrastructure, replacing manual wrangler.toml configuration with code-based resource definitions.

## Configuration Files

- `alchemy.run.ts` - Default/development configuration
- `alchemy.dev.ts` - Development environment specific configuration
- `alchemy.prod.ts` - Production environment specific configuration

## Resources Managed

### Cloudflare Worker
- **Name**: finance-manager (production) / finance-manager-dev (development)
- **Entry Point**: `./src/worker/index.ts`
- **Compatibility Date**: 2024-12-01
- **Compatibility Flags**: nodejs_compat

### D1 Database
- **Development**: finance-manager-db-dev
- **Production**: prod-finance-manager-db
- **Binding**: FINANCE_MANAGER_DB

### KV Namespace
- **Development**: finance-manager-cache-dev
- **Production**: finance-manager-cache-prod
- **Binding**: FINANCE_MANAGER_CACHE

### R2 Bucket
- **Development**: finance-manager-documents-dev
- **Production**: prod-finance-manager-documents
- **Binding**: FINANCE_MANAGER_DOCUMENTS

### AI Binding
- **Binding**: AI
- **Purpose**: OCR functionality and other AI features

## Deployment Commands

### Using Alchemy (Recommended)
```bash
# Deploy to development
pnpm deploy

# Deploy to production
pnpm deploy:prod

# Destroy infrastructure
pnpm destroy
```

### Using Wrangler (Legacy)
```bash
# Deploy using wrangler
pnpm deploy:wrangler

# Deploy to production using wrangler
pnpm deploy:prod:wrangler
```

## Environment Variables

### Development
- `ENVIRONMENT`: "development"
- `AUTH_SESSION_DURATION`: "7d"
- `AWS_REGION`: "us-east-1"
- `SES_FROM_EMAIL`: "noreply@finance-manager.com"
- `SES_FROM_NAME`: "Finance Manager"

### Production
- `ENVIRONMENT`: "production"
- `AUTH_SESSION_DURATION`: "7d"
- `AWS_REGION`: "us-east-1"
- `SES_FROM_EMAIL`: "noreply@finance-manager.com"
- `SES_FROM_NAME`: "Finance Manager"

## Secrets Management

Secrets should be managed through Cloudflare's secrets system:

```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set AWS credentials
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

## Migration from Wrangler.toml

The project has been migrated from manual `wrangler.toml` configuration to Alchemy Infrastructure-as-Code. The `wrangler.toml` file is kept for reference and fallback deployment options.

### Benefits of Alchemy

1. **Type Safety**: Full TypeScript support for infrastructure configuration
2. **Code Reuse**: Share configuration between environments
3. **Version Control**: Infrastructure changes are tracked in git
4. **Programmatic**: Dynamic resource creation and configuration
5. **Integration**: Better integration with application code

## Troubleshooting

### Authentication
Ensure you're logged into Cloudflare:
```bash
wrangler login
```

### Environment Variables
Set required environment variables:
```bash
export CLOUDFLARE_API_TOKEN="your_api_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
```

Or create a `.env` file:
```
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Resource Conflicts
If you encounter resource conflicts, you may need to destroy existing resources:
```bash
pnpm destroy
```

Then redeploy:
```bash
pnpm deploy
```