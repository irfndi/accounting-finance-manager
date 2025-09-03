#!/bin/bash

# Finance Manager VPS Deployment Script
# This script deploys the Finance Manager application to a VPS

set -e

echo "🚀 Starting Finance Manager VPS deployment..."

# Configuration
PROJECT_NAME="finance-manager"
REMOTE_USER="root"
REMOTE_HOST=""  # Set your VPS IP/hostname
REMOTE_DIR="/opt/${PROJECT_NAME}"

# Check if required files exist
if [ ! -f "infrastructure/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi

if [ ! -d "apps/web" ]; then
    echo "❌ apps/web directory not found"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ backend directory not found"
    exit 1
fi

# Install dependencies and build the application
echo "📦 Installing dependencies and building application..."
bun install && cd apps/web && bun install

echo "🏗️ Building application..."
cd infrastructure && docker-compose build

# Create deployment package
echo "📁 Creating deployment package..."
tar -czf deploy.tar.gz \
    infrastructure \
    apps/web \
    backend \
    config \
    scripts \
    docs \
    bun.lockb

# Upload to VPS
echo "📤 Uploading to VPS..."
scp deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# Deploy on VPS
echo "🔧 Deploying on VPS..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
    # Stop existing containers
    cd /opt/finance-manager || mkdir -p /opt/finance-manager
    cd /opt/finance-manager
    cd infrastructure && docker-compose down || true

    # Extract new deployment
    tar -xzf /tmp/deploy.tar.gz -C /opt/finance-manager
    rm /tmp/deploy.tar.gz

    # Copy environment file if it doesn't exist
    if [ ! -f config/.env ]; then
        cp config/.env.example config/.env
        echo "⚠️  Please edit config/.env file with your configuration"
    fi

    # Start services
    cd infrastructure && docker-compose up -d

    # Clean up old images
    docker image prune -f
EOF

# Clean up local deployment package
rm deploy.tar.gz

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at http://${REMOTE_HOST}"
echo "📊 Check logs with: cd infrastructure && docker-compose logs -f"