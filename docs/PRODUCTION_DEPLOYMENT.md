# 🚀 Production Deployment Guide

## Corporate Finance Manager - Production Deployment Checklist

This guide covers the complete deployment process for the Corporate Finance Manager system using Docker and VPS.

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Setup (Required)

- [x] VPS server with Ubuntu 20.04+ or CentOS 7+
- [x] Domain name pointing to VPS IP
- [x] Docker and Docker Compose installed on VPS
- [x] SSL certificate (Let's Encrypt recommended)
- [x] GitHub repository configured
- [x] SSH access to VPS

### 🛠️ Production Resources to Create

#### 1. VPS Server Requirements

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Bandwidth**: 1TB+
- **OS**: Ubuntu 20.04+ or CentOS 7+

**Recommended Requirements:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Bandwidth**: 2TB+

#### 2. Domain and DNS Setup

```bash
# Configure DNS records
A record: yourdomain.com → VPS_IP
AAAA record: yourdomain.com → VPS_IPV6 (if available)
CNAME record: www → yourdomain.com
```

#### 3. SSL Certificate

```bash
# Install Let's Encrypt SSL certificate
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### 🔧 Configuration Updates Needed

1. **Update `config/.env.production`**:

   - Database credentials
   - Redis configuration
   - JWT secret
   - Email configuration
   - AI API keys

2. **Update `infrastructure/nginx/nginx.conf`**:

   - Domain name
   - SSL certificate paths
   - Upstream servers

### 🗄️ Database Setup

#### PostgreSQL Setup

```bash
# Install PostgreSQL on VPS
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb finance_manager
sudo -u postgres createuser finance_user

# Set password
sudo -u postgres psql -c "ALTER USER finance_user PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE finance_manager TO finance_user;"
```

#### Redis Setup

```bash
# Install Redis on VPS
sudo apt install redis-server

# Configure Redis
sudo systemctl enable redis
sudo systemctl start redis
```

#### Run Production Migrations

```bash
# Apply database migrations to production
bun run db:migrate
```

## 🚀 Deployment Process

### 1. Pre-Deployment Testing

```bash
# Ensure all tests pass
bun run test:all

# Run specific test suites
bun run test:web      # Frontend tests
bun run test:api      # Backend tests
bun run test:e2e      # End-to-end tests

# Test build process for production
bun run build
bun run build:api

# Test Docker build
bun run docker:build
```

### 2. Deploy to Production

#### Automated Deployment (Recommended)

```bash
# Deploy to VPS using automated script
bun run deploy:vps
# Or using Makefile
make deploy/vps
```

#### Manual Deployment

```bash
# Build Docker images
bun run docker:build

# Create deployment package
tar -czf deploy.tar.gz \
    infrastructure \
    apps/web \
    backend \
    config \
    scripts \
    docs \
    bun.lockb

# Upload to VPS
scp deploy.tar.gz user@your-vps-ip:/tmp/

# Deploy on VPS
ssh user@your-vps-ip
cd /opt/finance-manager
tar -xzf /tmp/deploy.tar.gz
cp config/.env.example config/.env
# Edit config/.env with production values
cd infrastructure
docker-compose up -d
```

### 3. Post-Deployment Verification

#### Health Check

```bash
# Test the health endpoint
curl https://yourdomain.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2024-01-XX...",
  "version": "1.0.0"
}
```

#### API Endpoints Test

```bash
# Test main API endpoint
curl https://yourdomain.com/api/

# Test accounts endpoint
curl https://yourdomain.com/api/accounts

# Test frontend
curl https://yourdomain.com/
```

#### Service Status Check

```bash
# Check Docker services status
ssh user@your-vps-ip
cd /opt/finance-manager/infrastructure
docker-compose ps

# Check logs
docker-compose logs -f

# Check database connection
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT 1;"
```

## 🔍 Monitoring & Observability

### Available Monitoring

- **Docker Container Monitoring**: Container health and resource usage
- **Nginx Access Logs**: HTTP request logging and analytics
- **Application Logs**: Structured logging from both frontend and backend
- **Health Endpoints**: `/health` for uptime monitoring
- **Database Monitoring**: PostgreSQL performance and query statistics
- **Redis Monitoring**: Cache performance and memory usage
- **System Monitoring**: CPU, memory, disk usage on VPS

### Log Monitoring

```bash
# Monitor application logs
ssh user@your-vps-ip
cd /opt/finance-manager/infrastructure

# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# View Nginx logs
docker-compose logs -f nginx
```

### Health Checks

```bash
# Application health check
curl https://yourdomain.com/health

# Database health check
docker-compose exec postgres pg_isready -U finance_user -d finance_manager

# Redis health check
docker-compose exec redis redis-cli ping
```

## 🔐 Security Considerations

### Current Security Features

- ✅ JWT-based authentication with secure session management
- ✅ CORS properly configured for production domain
- ✅ Environment isolation (dev/prod)
- ✅ No sensitive data in configuration files
- ✅ SSL/TLS encryption for all communications
- ✅ Docker container isolation
- ✅ Double-entry accounting validation
- ✅ Input validation on all endpoints
- ✅ Rate limiting and security headers
- ✅ Database password hashing
- ✅ Redis password protection (if configured)
- ✅ Nginx security headers

### Production Security Checklist

- [ ] Verify SSL certificate is valid and not expired
- [ ] Configure firewall rules on VPS (only open ports 80, 443, 22)
- [ ] Set up automatic security updates
- [ ] Configure fail2ban for SSH protection
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated
- [ ] Use strong passwords for database and Redis

### Security Hardening

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🚨 Rollback Plan

### Quick Rollback Process

```bash
# If issues arise, quickly rollback to previous version
ssh user@your-vps-ip
cd /opt/finance-manager

# Stop current services
cd infrastructure
docker-compose down

# Restore from backup (if available)
docker-compose exec postgres pg_dump -U finance_user finance_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore previous version
git checkout <previous-working-commit>
docker-compose up -d
```

### Database Backup and Restore

```bash
# Create database backup
docker-compose exec postgres pg_dump -U finance_user finance_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database backup
docker-compose exec -i postgres psql -U finance_user finance_manager < backup_20240101_120000.sql
```

### Service Restart Strategy

```bash
# Graceful restart of services
docker-compose restart frontend
docker-compose restart backend
docker-compose restart postgres
docker-compose restart redis
```

## 📊 Performance Expectations

### Expected Performance

- **Frontend Load Time**: < 2 seconds
- **API Response Time**: < 100ms average
- **Database Query**: < 20ms average
- **Redis Cache Response**: < 5ms average
- **Concurrent Users**: 500+ supported
- **Docker Container Startup**: < 30 seconds

### Monitoring Metrics

- Request rate and success rate
- Error rate and types
- Database query performance
- Redis cache hit/miss ratio
- Memory and CPU usage
- Disk space usage
- Network bandwidth

### Performance Optimization

```bash
# Monitor resource usage
docker stats

# Check database performance
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker-compose exec redis redis-cli info memory
```

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

Set up automated deployment with:

- Automated testing on pull requests
- Automatic deployment to staging on feature branches
- Manual approval for production deployment
- Rollback automation on failure

### Manual Deployment Workflow

1. Test changes locally with `bun run dev`
2. Run full test suite with `bun run test:all`
3. Test production build with `bun run build`
4. Test Docker build with `bun run docker:build`
5. Deploy with `bun run deploy:vps`
6. Verify deployment with health checks

## 📞 Support & Troubleshooting

### Common Issues

1. **Database Connection**: Verify PostgreSQL credentials and network
2. **Redis Connection**: Check Redis service status and configuration
3. **Container Issues**: Check Docker logs and container status
4. **Nginx Configuration**: Verify domain and SSL certificate paths
5. **Environment Variables**: Ensure all required variables are set

### Debug Commands

```bash
# Check service status
ssh user@your-vps-ip
cd /opt/finance-manager/infrastructure
docker-compose ps

# Check system resources
htop
df -h
free -h

# Check network connectivity
curl -I https://yourdomain.com
ping yourdomain.com

# Check database connectivity
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT 1;"

# Check Redis connectivity
docker-compose exec redis redis-cli ping

# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📈 Next Steps After Deployment

1. **Monitor Performance**: Watch initial traffic and response times
2. **Set Up Monitoring**: Configure log aggregation and alerting
3. **SSL Certificate**: Set up automatic renewal with Let's Encrypt
4. **Backup Strategy**: Implement automated database backups
5. **Security Audit**: Review security configurations and access controls
6. **Performance Testing**: Load test the application with expected traffic
7. **Documentation**: Update API documentation with production URLs
8. **User Testing**: Begin user acceptance testing with real data

## 🔄 Maintenance Tasks

### Regular Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up unused Docker resources
docker system prune -f

# Check disk space
df -h

# Monitor logs
docker-compose logs --tail=100
```

### Database Maintenance

```bash
# Database backup
docker-compose exec postgres pg_dump -U finance_user finance_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Database vacuum and analyze
docker-compose exec postgres psql -U finance_user -d finance_manager -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT pg_size_pretty(pg_database_size('finance_manager'));"
```

### Security Updates

```bash
# Check for security updates
sudo apt list --upgradable

# Update SSL certificates
sudo certbot renew --dry-run
sudo certbot renew

# Check for Docker security updates
docker system prune -f
```

---

## 🎯 Quick Deployment Commands Summary

```bash
# Complete production deployment process

# 1. Prepare VPS
sudo apt update && sudo apt install docker.io docker-compose postgresql redis-server certbot

# 2. Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Setup SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 4. Deploy application
bun run deploy:vps

# 5. Verify deployment
curl https://yourdomain.com/health
curl https://yourdomain.com/api/
curl https://yourdomain.com/

# 6. Monitor services
ssh user@your-vps-ip
cd /opt/finance-manager/infrastructure
docker-compose ps
docker-compose logs -f
```

---

**Last Updated**: 2025-09-03  
**System Status**: ✅ Ready for Production Deployment  
**Architecture**: Go + Astro + Bun + Docker + VPS  
**Documentation**: Updated for current technology stack
