# 🏗️ Infrastructure Documentation

## Finance Manager - Infrastructure Setup

This document provides comprehensive documentation for the infrastructure setup and configuration of the Finance Manager application.

## 📋 Infrastructure Overview

### Architecture Components

```
┌────────────────────────────────────────────────────────────────────────┐
│  Internet                                                              │
│     ⬇ HTTPS (443) / HTTP (80)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Nginx Reverse Proxy                                                 │ │
│  │  - SSL Termination                                                  │ │
│  │  - Load Balancing                                                   │ │
│  │  - Rate Limiting                                                    │ │
│  │  - Static File Caching                                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│           ⬇                              ⬇                              │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  Astro Frontend                │  │  Go Backend API               │ │
│  │  - Port 3000                   │  │  - Port 8080                   │ │
│  │  - React Islands                │  │  - JWT Authentication          │ │
│  │  - Static Site Generation       │  │  - Business Logic             │ │
│  │  - Asset Optimization           │  │  - Database Operations         │ │
│  └────────────────────────────────┘  └────────────────────────────────┘ │
│           ⬇                              ⬇                              │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  PostgreSQL Database           │  │  Redis Cache                  │ │
│  │  - Port 5432                   │  │  - Port 6379                   │ │
│  │  - ACID Compliance             │  │  - Session Storage             │ │
│  │  - Data Persistence            │  │  - Query Results Cache         │ │
│  │  - Backup Automation            │  │  - Rate Limiting              │ │
│  └────────────────────────────────┘  └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Service Specifications

| Service | Image | Port | Purpose | Resources |
|---------|-------|------|---------|-----------|
| **Nginx** | nginx:1.25-alpine | 80, 443 | Reverse Proxy | 128MB RAM |
| **Frontend** | finance-frontend | 3000 | Astro + React | 512MB RAM |
| **Backend** | finance-backend | 8080 | Go API | 256MB RAM |
| **PostgreSQL** | postgres:15-alpine | 5432 | Database | 1GB RAM |
| **Redis** | redis:7-alpine | 6379 | Cache | 256MB RAM |

## 🔧 Configuration Files

### 1. Docker Compose (`infrastructure/docker-compose.yml`)

The main orchestration file that defines all services:

```yaml
version: "3.8"
services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
      - VITE_API_URL=/api

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      - APP_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=finance_manager
      - DB_USER=finance_user
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_URL=redis:6379
      - JWT_SECRET=${JWT_SECRET}

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=finance_manager
      - POSTGRES_USER=finance_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d:ro

  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/etc/redis/redis.conf:ro
```

### 2. Nginx Configuration (`infrastructure/nginx/nginx.conf`)

Production-ready reverse proxy configuration:

```nginx
events {
    worker_connections 1024;
}

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name localhost;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name localhost;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Frontend proxy
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # API proxy with rate limiting
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 3. Redis Configuration (`infrastructure/redis/redis.conf`)

Optimized Redis configuration for caching:

```redis.conf
# Network
bind 0.0.0.0
port 6379
tcp-keepalive 300

# General
daemonize no
supervised no
loglevel notice
databases 16

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Security
requirepass ""
```

## 🚀 Deployment Setup

### Prerequisites

1. **VPS Requirements**:
   - Ubuntu 20.04+ or CentOS 7+
   - 2 CPU cores minimum
   - 4GB RAM minimum
   - 50GB SSD storage

2. **Domain Configuration**:
   - A record: `yourdomain.com` → VPS IP
   - AAAA record: `yourdomain.com` → VPS IPv6 (if available)

3. **SSL Certificate**:
   - Let's Encrypt certificate
   - Auto-renewal setup

### Installation Steps

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install additional tools
sudo apt install nginx certbot git
```

#### 2. SSL Certificate Setup

```bash
# Create SSL directory
sudo mkdir -p /etc/letsencrypt/live/yourdomain.com

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create certificate links
sudo ln -s /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/certificate.crt
sudo ln -s /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/private.key
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd finance-manager

# Configure environment
cp config/.env.example config/.env
nano config/.env

# Build and start services
docker-compose build
docker-compose up -d

# Run database migrations
docker-compose exec backend go run cmd/migrate.go
```

### Service Management

#### Starting and Stopping Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View service status
docker-compose ps
```

#### Monitoring and Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# View recent logs
docker-compose logs --tail=100 backend
```

#### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U finance_user -d finance_manager

# Create database backup
docker-compose exec postgres pg_dump -U finance_user finance_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -i postgres psql -U finance_user finance_manager < backup_20240101_120000.sql
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Fail2Ban setup
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Docker Security

```bash
# Create dedicated docker user
sudo groupadd docker
sudo usermod -aG docker $USER

# Configure Docker daemon security
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "icc": false,
  "userland-proxy": false
}
```

### Application Security

1. **Environment Variables**:
   - Never commit secrets to version control
   - Use strong passwords and JWT secrets
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

3. **Network Security**:
   - Use internal Docker networking
   - Limit exposed ports
   - Use HTTPS only

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Database health
docker-compose exec postgres pg_isready -U finance_user -d finance_manager

# Redis health
docker-compose exec redis redis-cli ping
```

### Resource Monitoring

```bash
# Docker container stats
docker stats

# System resource usage
htop
df -h
free -h

# Network monitoring
iftop
nethogs
```

### Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/docker-compose

# Example log rotation configuration
/var/log/docker/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### Backup Strategy

#### Automated Database Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec postgres pg_dump -U finance_user finance_manager > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check resource usage
docker stats

# Check port conflicts
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
```

#### 2. Database Connection Issues

```bash
# Check database container
docker-compose ps postgres

# Test database connection
docker-compose exec postgres pg_isready -U finance_user -d finance_manager

# Check database logs
docker-compose logs postgres
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Check Nginx configuration
sudo nginx -t
```

#### 4. Performance Issues

```bash
# Check container resource usage
docker stats

# Monitor database performance
docker-compose exec postgres psql -U finance_user -d finance_manager -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker-compose exec redis redis-cli info memory
```

### Emergency Procedures

#### 1. Full System Restart

```bash
# Stop all services
docker-compose down

# Clean up Docker resources
docker system prune -f

# Restart services
docker-compose up -d
```

#### 2. Database Recovery

```bash
# Stop database
docker-compose stop postgres

# Restore from backup
docker-compose run --rm postgres psql -U finance_user -h postgres -d finance_manager < backup_20240101_120000.sql

# Start database
docker-compose start postgres
```

## 📈 Performance Optimization

### Nginx Optimization

```nginx
# Add to nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Optimize buffers
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Optimize timeouts
    client_body_timeout 10;
    client_header_timeout 10;
    keepalive_timeout 30;
    send_timeout 10;
}
```

### PostgreSQL Optimization

```sql
-- Add to postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

### Redis Optimization

```redis.conf
# Memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence optimization
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Network optimization
tcp-keepalive 300
timeout 0
tcp-backlog 511
```

## 🔄 Scaling Considerations

### Vertical Scaling

- Increase VPS resources (CPU, RAM, Storage)
- Optimize database performance
- Implement caching strategies

### Horizontal Scaling

- Load balancer with multiple backend instances
- Database read replicas
- Redis cluster for distributed caching

### Database Scaling

- Implement connection pooling
- Use read replicas for read-heavy operations
- Consider database sharding for large datasets

---

## 📚 Additional Resources

### Documentation Links

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### Tools and Utilities

- **Docker**: Containerization platform
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **Certbot**: Let's Encrypt SSL certificate management
- **PostgreSQL**: Relational database
- **Redis**: In-memory data structure store

---

**Last Updated**: 2025-09-03  
**Next Review**: 2025-12-03  
**Status**: ✅ Production Ready