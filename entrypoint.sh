#!/bin/sh
set -e

cd /app

echo "[startup] Pulling latest code..."
CURRENT=$(git rev-parse HEAD 2>/dev/null || echo "none")

# Use HTTPS so no SSH key is needed (works for public repos)
git remote set-url origin https://github.com/Augmaster/Nuclei-Parser.git
git pull origin main 2>&1 || echo "[startup] Warning: git pull failed, using current code"

LATEST=$(git rev-parse HEAD 2>/dev/null || echo "none")

if [ "$CURRENT" != "$LATEST" ] || [ ! -d "/usr/share/nginx/html/assets" ]; then
  echo "[startup] Changes detected, rebuilding application..."
  npm ci
  npm run build
  echo "[startup] Deploying built files..."
  rm -rf /usr/share/nginx/html/*
  cp -r /app/dist/* /usr/share/nginx/html/
  echo "[startup] Build complete (${LATEST})."
else
  echo "[startup] No changes detected (${LATEST}), skipping rebuild."
fi

echo "[startup] Starting nginx..."
exec nginx -g "daemon off;"
