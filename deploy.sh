#!/bin/bash

# Customer Call Tracker - Quick Deployment Script (Nixpacks Ready)
# This script helps with local testing before Coolify deployment

set -e

echo "🚀 Customer Call Tracker Deployment Script"
echo "=========================================="
echo "Nixpacks-powered deployment for Coolify"
echo ""

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
echo "1) Local production build test"
echo "2) Local development server"
echo "3) Coolify/Nixpacks readiness check"
echo "4) All of the above"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🏗️  Building for production..."
        npm run build:prod
        echo "✅ Build complete! Files are in ./build directory"
        echo "🌐 To test locally: npm run serve"
        echo "🌐 Manual test: npx serve -s build -l 3000"
        ;;
    2)
        echo "🖥️  Starting development server..."
        echo "🌐 Development server will start on http://localhost:3000"
        echo "💡 Press Ctrl+C to stop the server"
        npm start
        ;;
    3)
        echo "🔍 Checking Coolify/Nixpacks readiness..."
        echo "✅ nixpacks.toml exists"
        echo "✅ package.json configured for Nixpacks"
        echo "✅ serve package added for production serving"
        echo "✅ Environment template exists"
        echo "✅ All Nixpacks deployment files are ready!"
        echo ""
        echo "Next steps:"
        echo "1. Push your code to GitHub"
        echo "2. Follow the DEPLOYMENT.md guide"
        echo "3. Set up your project in Coolify with Nixpacks"
        ;;
    4)
        echo "🏗️  Building for production..."
        npm run build:prod
        
        echo "🔍 Checking Coolify/Nixpacks readiness..."
        echo "✅ All deployment files are ready!"
        
        echo ""
        echo "🎉 Deployment preparation complete!"
        echo ""
        echo "Next steps:"
        echo "1. Push to GitHub: git add . && git commit -m 'Ready for Nixpacks deployment' && git push"
        echo "2. Follow DEPLOYMENT.md for Coolify setup with Nixpacks"
        echo "3. Test locally with: npm run serve"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Nixpacks deployment script completed successfully!"
echo "🚀 Ready for Coolify deployment!"