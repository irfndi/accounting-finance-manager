#!/bin/bash
set -e

echo "🔧 Installing dependencies with fallback for overrides mismatch..."
# Try frozen lockfile first, fallback to updating if overrides mismatch
pnpm install --frozen-lockfile || {
  echo "⚠️  Lockfile config mismatch detected, updating lockfile..."
  pnpm install --no-frozen-lockfile
}

echo "🔨 Building application for deployment..."
pnpm astro check && pnpm astro build
echo "✅ Application built successfully"