#!/bin/bash

# Render.com Deployment Script
# This script helps you deploy to Render.com

set -e

echo "🚀 Render.com Deployment Helper"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  No git remote found"
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo "✅ Remote added: $repo_url"
fi

# Check for required files
echo "📋 Checking required files..."
required_files=("package.json" "server.js" "Dockerfile" "render.yaml")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done
echo ""

# Commit and push
echo "📦 Preparing deployment..."
git add .
read -p "Enter commit message (or press Enter for default): " commit_msg
commit_msg=${commit_msg:-"Deploy to Render"}
git commit -m "$commit_msg" || echo "No changes to commit"

echo ""
echo "🔄 Pushing to GitHub..."
git push origin main || git push origin master

echo ""
echo "✅ Code pushed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your repository"
echo "4. Select 'Docker' runtime"
echo "5. Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - MONGODB_URI=<your-mongodb-uri>"
echo "   - CORS_ORIGIN=https://your-app.onrender.com"
echo "6. Click 'Create Web Service'"
echo ""
echo "📚 Full guide: RENDER_DEPLOYMENT.md"
echo ""
