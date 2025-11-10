# Customer Call Tracker - Coolify Deployment Guide

This guide will help you deploy the Customer Call Tracker application to Coolify using GitHub as your repository source.

## Prerequisites

- GitHub account with the code pushed to a repository
- Coolify instance running
- Supabase project for the database (existing or create new)

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub
```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Customer Call Tracker application"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/customer-call-tracker.git

# Push to GitHub
git push -u origin main
```

### 1.2 Environment Variables Setup
1. Copy `.env.example` to `.env` in your local repository
2. Update the Supabase configuration with your actual values:
   ```env
   REACT_APP_SUPABASE_URL=your_actual_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```
3. Commit and push the `.env` file to your repository

## Step 2: Deploy to Coolify

### 2.1 Create New Project in Coolify
1. Log in to your Coolify dashboard
2. Click "New Project"
3. Choose "Deploy from Git Repository"

### 2.2 Configure Repository Settings
1. **Repository**: Select your GitHub repository
2. **Branch**: Set to `main` (or your preferred branch)
3. **Project Type**: Select "Static Site" or "React App"
4. **Build Command**: `npm run build:prod`
5. **Output Directory**: `build`

### 2.3 Environment Variables in Coolify
In the Coolify project settings, add these environment variables:

```env
# Supabase Configuration (Required)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Environment
REACT_APP_ENV=production

# Optional Customizations
REACT_APP_NAME=Customer Call Tracker
```

### 2.4 Port Configuration
- Coolify will automatically detect the port from the Dockerfile
- The application will be served on port 80 inside the container
- Coolify will map this to an external port automatically

## Step 3: Build and Deploy

### 3.1 Trigger Build
1. Click "Deploy" in Coolify
2. Monitor the build logs for any errors
3. The build process will:
   - Pull your code from GitHub
   - Install dependencies
   - Build the React application
   - Create a Docker image
   - Deploy the container

### 3.2 Access Your Application
- Once deployment is complete, Coolify will provide a URL
- Your application will be accessible at that URL

## Step 4: Domain Configuration (Optional)

### 4.1 Custom Domain Setup
1. In Coolify, go to your project settings
2. Under "Domains", add your custom domain
3. Configure DNS records to point to your Coolify instance
4. SSL certificate will be automatically provisioned

### 4.2 Update nginx.conf (if needed)
If you need custom domain routing, update the `nginx.conf` file:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # ... rest of configuration
}
```

## Step 5: Database Configuration

### 5.1 Supabase Setup
If you haven't set up your Supabase database yet:

1. Create a new Supabase project
2. Run the database schema from `database/schema.sql`
3. Update your environment variables with the new Supabase URL and keys

### 5.2 Database Migration
Upload and run the SQL files in your Supabase SQL editor:
- `database/schema.sql` - Main database schema
- `database/final_schema.sql` - Updated schema (if different)

## Step 6: Monitoring and Maintenance

### 6.1 Health Checks
The application includes a health check endpoint at `/health` that Coolify can monitor.

### 6.2 Logs
- View application logs in Coolify dashboard
- Nginx logs are included for debugging
- Application-specific logs can be viewed in browser console

### 6.3 Updates
- Updates are automatic when you push to your GitHub repository
- Coolify will detect changes and redeploy
- Use version tags in Git for controlled deployments

## Troubleshooting

### Build Issues
1. **Node Version**: Ensure your local development uses Node.js 18+ to match the Dockerfile
2. **Dependencies**: Check that all dependencies are properly listed in `package.json`
3. **Environment Variables**: Verify all required environment variables are set

### Runtime Issues
1. **Supabase Connection**: Check browser console for API errors
2. **Routing**: Ensure nginx configuration supports React Router
3. **Assets**: Verify all static assets are properly built and served

### Performance
1. **Caching**: Static assets are cached for 1 year by default
2. **Gzip**: Enabled for text assets to reduce bandwidth
3. **CDN**: Consider using Coolify's built-in CDN features

## Docker Deployment (Alternative)

If you prefer to deploy manually using Docker:

```bash
# Build the image
docker build -t customer-call-tracker .

# Run the container
docker run -p 3000:80 \
  -e REACT_APP_SUPABASE_URL=your_supabase_url \
  -e REACT_APP_SUPABASE_ANON_KEY=your_supabase_key \
  customer-call-tracker
```

## Security Considerations

1. **Environment Variables**: Never commit actual API keys to Git
2. **HTTPS**: Use SSL certificates in production
3. **Headers**: Security headers are included in nginx configuration
4. **CORS**: Configure Supabase CORS settings for your domain

## Support

- Check Coolify documentation for platform-specific issues
- Review application logs in Coolify dashboard
- Test locally with `docker-compose up` before deploying

Your Customer Call Tracker application should now be successfully deployed and accessible via Coolify!