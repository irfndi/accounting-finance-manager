# 🚀 Production Deployment Guide

## Corporate Finance Manager - Production Deployment Checklist

This guide covers the complete deployment process for the Corporate Finance Manager system to Cloudflare Workers.

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Setup (Completed)
- [x] GitHub repository configured
- [x] Cloudflare account and domain setup
- [x] GitHub & Cloudflare integration
- [x] GitHub & Snyk security integration
- [x] Wrangler CLI configured with tokens

### 🛠️ Production Resources to Create

#### 1. Create Production D1 Database
```bash
# Create production database
wrangler d1 create finance-manager-db-prod

# Update wrangler.toml with the returned database ID
# Replace the TODO comment with actual production database ID
```

#### 2. Create Production KV Namespace
```bash
# Create production KV namespace for caching
wrangler kv:namespace create "FINANCE_MANAGER_CACHE" --env production

# Update wrangler.toml with the returned namespace ID
```

#### 3. Create Production R2 Bucket
```bash
# Create production R2 bucket for document storage
wrangler r2 bucket create finance-manager-documents-prod
```

### 🔧 Configuration Updates Needed

1. **Update `worker/wrangler.toml`**:
   - Replace production database ID (currently using dev ID)
   - Replace production KV namespace ID
   - Verify R2 bucket names

2. **Environment Variables** (if needed):
   - No secrets currently required
   - All configuration is handled via bindings

### 🗄️ Database Setup

#### Run Production Migrations
```bash
# Navigate to worker directory
cd worker

# Apply database migrations to production
pnpm migrate:prod
```

#### Verify Database Schema
```bash
# Check production database structure
wrangler d1 execute finance-manager-db-prod --command "SELECT name FROM sqlite_master WHERE type='table';" --env production
```

## 🚀 Deployment Process

### 1. Pre-Deployment Testing
```bash
# Ensure all tests pass
pnpm test

# Test build process for production
cd worker
pnpm build:prod
```

### 2. Deploy to Production
```bash
# Deploy to production environment
pnpm deploy:prod
```

### 3. Post-Deployment Verification

#### Health Check
```bash
# Test the health endpoint
curl https://finance-manager.irfandimarsya.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2024-01-XX...",
  "worker": "finance-manager"
}
```

#### API Endpoints Test
```bash
# Test main API endpoint
curl https://finance-manager.irfandimarsya.workers.dev/api/

# Test accounts endpoint
curl https://finance-manager.irfandimarsya.workers.dev/api/accounts
```

## 🔍 Monitoring & Observability

### Available Monitoring
- **Cloudflare Analytics**: Built-in request/response monitoring
- **Worker Logs**: Real-time log streaming via `pnpm tail:prod`
- **Health Endpoint**: `/health` for uptime monitoring

### Log Monitoring
```bash
# Monitor production logs in real-time
cd worker
pnpm tail:prod
```

## 🔐 Security Considerations

### Current Security Features
- ✅ CORS properly configured
- ✅ Environment isolation (dev/prod)
- ✅ No sensitive data in configuration
- ✅ Snyk security monitoring enabled
- ✅ Double-entry accounting validation
- ✅ Input validation on all endpoints

### Production Security Checklist
- [ ] Verify domain SSL certificate
- [ ] Monitor Snyk security alerts
- [ ] Review Cloudflare security settings
- [ ] Set up rate limiting if needed

## 🚨 Rollback Plan

### Quick Rollback Process
```bash
# If issues arise, quickly rollback to previous version
wrangler rollback --env production

# Or deploy a specific version
git checkout <previous-working-commit>
cd worker
pnpm deploy:prod
```

### Database Rollback (if needed)
- Database migrations are forward-only
- Consider creating a backup before major changes
- Use `wrangler d1 backup` for critical operations

## 📊 Performance Expectations

### Expected Performance
- **Cold Start**: < 100ms
- **API Response Time**: < 50ms average
- **Database Query**: < 10ms average
- **Concurrent Users**: 1000+ supported

### Monitoring Metrics
- Request rate and success rate
- Error rate and types
- Database query performance
- Memory and CPU usage

## 🔄 Continuous Deployment

### GitHub Actions (Future Enhancement)
Consider setting up automated deployment with:
- Automated testing on pull requests
- Automatic deployment to production on main branch
- Rollback automation on failure

### Manual Deployment Workflow
1. Test changes locally with `pnpm dev`
2. Run full test suite with `pnpm test`
3. Test production build with `pnpm build:prod`
4. Deploy with `pnpm deploy:prod`
5. Verify deployment with health checks

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection**: Verify D1 binding and migrations
2. **CORS Issues**: Check CORS configuration in worker
3. **Route Not Found**: Verify Hono routing configuration

### Debug Commands
```bash
# Check worker status
wrangler whoami

# List available databases
wrangler d1 list

# Check KV namespaces
wrangler kv:namespace list

# View recent logs
wrangler tail --env production
```

## 📈 Next Steps After Deployment

1. **Monitor Performance**: Watch initial traffic and response times
2. **Set Up Alerts**: Configure monitoring for critical endpoints
3. **Documentation**: Update API documentation with production URLs
4. **User Testing**: Begin user acceptance testing with real data
5. **Backup Strategy**: Implement regular database backups

---

## 🎯 Quick Deployment Commands Summary

```bash
# Complete production deployment process
cd worker

# 1. Create production resources (one-time setup)
wrangler d1 create finance-manager-db-prod
wrangler kv:namespace create "FINANCE_MANAGER_CACHE" --env production
wrangler r2 bucket create finance-manager-documents-prod

# 2. Update wrangler.toml with returned IDs

# 3. Run migrations
pnpm migrate:prod

# 4. Deploy
pnpm deploy:prod

# 5. Verify
curl https://finance-manager.irfandimarsya.workers.dev/health
```

---

**Last Updated**: 2024-01-XX  
**System Status**: ✅ Ready for Production Deployment 