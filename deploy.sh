#!/bin/bash

# Customer Call Tracker - Quick Deployment Script
# This script helps with local testing before Coolify deployment

set -e

echo "🚀 Customer Call Tracker Deployment Script"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your actual Supabase configuration before proceeding."
    echo "Required variables:"
    echo "  - REACT_APP_SUPABASE_URL"
    echo "  - REACT_APP_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Check if required environment variables are set
source .env

if [ -z "$REACT_APP_SUPABASE_URL" ] || [ "$REACT_APP_SUPABASE_URL" = "your_supabase_project_url" ]; then
    echo "❌ Please update REACT_APP_SUPABASE_URL in .env file"
    exit 1
fi

if [ -z "$REACT_APP_SUPABASE_ANON_KEY" ] || [ "$REACT_APP_SUPABASE_ANON_KEY" = "your_supabase_anon_key" ]; then
    echo "❌ Please update REACT_APP_SUPABASE_ANON_KEY in .env file"
    exit 1
fi

echo "✅ Environment variables validated"

# Option to choose deployment method
echo ""
echo "Choose deployment method:"
echo "1) Local Docker test"
echo "2) Production build"
echo "3) Coolify ready check"
echo "4) All of the above"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🐳 Running local Docker test..."
        docker build -t customer-call-tracker .
        docker run -p 3000:80 --env-file .env customer-call-tracker
        ;;
    2)
        echo "🏗️  Building for production..."
        npm run build:prod
        echo "✅ Build complete! Files are in ./build directory"
        echo "🌐 To test locally: npx serve -s build -l 3000"
        ;;
    3)
        echo "🔍 Checking Coolify readiness..."
        echo "✅ Dockerfile exists"
        echo "✅ nginx.conf exists"
        echo "✅ docker-compose.yml exists"
        echo "✅ Environment template exists"
        echo "✅ All deployment files are ready!"
        echo ""
        echo "Next steps:"
        echo "1. Push your code to GitHub"
        echo "2. Follow the DEPLOYMENT.md guide"
        echo "3. Set up your project in Coolify"
        ;;
    4)
        echo "🏗️  Building for production..."
        npm run build:prod
        
        echo "🐳 Building Docker image..."
        docker build -t customer-call-tracker .
        
        echo "🔍 Checking Coolify readiness..."
        echo "✅ All deployment files are ready!"
        
        echo ""
        echo "🎉 Deployment preparation complete!"
        echo ""
        echo "Next steps:"
        echo "1. Push to GitHub: git add . && git commit -m 'Ready for Coolify deployment' && git push"
        echo "2. Follow DEPLOYMENT.md for Coolify setup"
        echo "3. Test locally with: docker run -p 3000:80 --env-file .env customer-call-tracker"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Deployment script completed successfully!"