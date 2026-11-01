#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "⚙️ Installing Node dependencies and building React frontend..."
if command -v npm &> /dev/null; then
  npm install
  npm run build:client
else
  echo "⚠️ npm command not found; using existing dist/client bundle"
fi

echo "✅ Render build completed successfully!"
