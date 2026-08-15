#!/usr/bin/env bash
# ============================================================
# Havana Stones — VPS Deployment Script
# Deploys the static site to a remote VPS via Docker.
#
# Usage:
#   ./deploy.sh [user@host]
#
# Default target: ubuntu@83.228.219.249
# ============================================================
set -euo pipefail

TARGET="${1:-physio-vps-physio}"
REMOTE_DIR="/home/ubuntu/havana-stones"
CONTAINER="havana-stones"

echo "==> Deploying to ${TARGET}"

# 1. Sync project files to the VPS (exclude local-only files)
echo "==> Syncing files..."
rsync -az --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'deploy.sh' \
  --exclude 'README.md' \
  ./ "${TARGET}:${REMOTE_DIR}/"

# 2. Build & run the container on the VPS
#    NOTE: this VPS uses the standalone `docker-compose` (v2.24.5) command,
#    not the `docker compose` plugin.
echo "==> Building & starting container..."
ssh "${TARGET}" "cd ${REMOTE_DIR} && \
  docker-compose down || true && \
  docker-compose up -d --build"

# 3. Show status
echo "==> Container status:"
ssh "${TARGET}" "docker ps --filter name=${CONTAINER}"

echo ""
echo "==> Deployment complete."
echo "    Site available at: http://83.228.219.249:8080"
echo "    (port 80/443 are used by the existing physio site — do NOT change the port mapping)"
