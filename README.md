# Customer Call Tracker

A modern, responsive customer call management system built with React and Supabase. Features an intuitive dashboard for tracking customer interactions, follow-ups, and call dispositions with advanced filtering and timeline views.

## ✨ Features

### 📊 Enhanced Dashboard
- **Real-time Statistics**: View call metrics and performance indicators
- **Today's Calls Tab**: See only the latest call record per customer for today's followup dates
- **Historical Timeline**: Complete call history for audit and disposition tracking
- **Smart Deduplication**: Automatically groups multiple call records by customer and date

### 📅 Advanced Reminder System
- **Sticky Segment Navigation**: Overdue, Today, and This Week tabs with smooth animations
- **Multi-Select Filtering**: Filter by disposition status with beautiful filter pills
- **Glassmorphism Design**: Modern frosted glass UI with backdrop blur effects
- **Timeline Modal**: Complete call history with latest call prominently displayed

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for mobile and desktop
- **Touch-Friendly**: 44px minimum touch targets for mobile interaction
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Loading States**: Shimmer effects and smooth transitions

### 🔧 Technical Features
- **Supabase Integration**: Real-time database with Row Level Security
- **TypeScript Ready**: Fully typed components and hooks
- **Modern React**: Hooks, Context API, and functional components
- **Tailwind CSS**: Utility-first styling with custom design system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd customer-call-tracker
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase configuration:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   - Create a Supabase project
   - Run the SQL schema files in order:
     - `database/schema.sql`
     - `database/final_schema.sql`

4. **Start Development Server**
   ```bash
   npm start
   ```
   The app will open at [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Local Docker Test
```bash
# Build and run with environment file
docker build -t customer-call-tracker .
docker run -p 3000:80 --env-file .env customer-call-tracker
```

### Using Docker Compose
```bash
docker-compose up -d
```

## ☁️ Coolify Deployment

This application is fully configured for Coolify deployment:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Coolify deployment"
   git push origin main
   ```

2. **Follow Deployment Guide**
   See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Coolify setup instructions

3. **Quick Deployment Script**
   ```bash
   ./deploy.sh
   ```
   This script helps validate your environment and prepare for deployment

## 📁 Project Structure

```
customer-call-tracker/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.js      # Enhanced button components
│   │   ├── CallDisposition.js # Call logging interface
│   │   ├── Reminders.js   # Advanced reminder system
│   │   └── ...
│   ├── pages/             # Route components
│   │   ├── Dashboard.js   # Main dashboard
│   │   └── HomePage.js    # Landing page
│   ├── hooks/             # Custom React hooks
│   │   ├── useCustomerData.js
│   │   └── useApi.js
│   ├── services/          # API and external services
│   │   └── supabase.js    # Supabase configuration
│   ├── utils/             # Utility functions
│   └── index.css          # Global styles and design system
├── database/              # Database schema and migrations
│   ├── schema.sql         # Main database schema
│   └── final_schema.sql   # Updated schema
├── Dockerfile             # Docker container configuration
├── nginx.conf             # Production web server config
├── docker-compose.yml     # Docker Compose setup
├── deploy.sh             # Deployment helper script
└── DEPLOYMENT.md         # Detailed deployment guide
```

## 🛠️ Available Scripts

### Development
```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

### Deployment
```bash
npm run build:prod     # Production build (no source maps)
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
npm run docker:stop    # Stop Docker container
```

## 🎯 Key Components

### Reminders Component
- **Sticky Navigation**: Segment tabs that stay visible while scrolling
- **Multi-Select Filters**: Beautiful filter pills for disposition filtering
- **Glassmorphism Cards**: Modern design with backdrop blur effects
- **Timeline Modal**: Complete customer call history

### Dashboard Component  
- **Statistics Cards**: Key metrics and performance indicators
- **Today's Calls**: Latest record per customer (deduplicated)
- **Historical Timeline**: Full call history for audit purposes
- **Responsive Layout**: Mobile-first design with proper touch targets

## 🔧 Configuration

### Environment Variables
```env
# Required
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
REACT_APP_ENV=production
REACT_APP_NAME="Customer Call Tracker"
REACT_APP_API_BASE_URL=https://your-api-domain.com
```

### Supabase Setup
1. Create a new Supabase project
2. Enable Row Level Security (RLS) on all tables
3. Configure authentication policies
4. Set up real-time subscriptions (optional)

## 🚢 Deployment Options

### Coolify (Recommended)
- **GitHub Integration**: Automatic deployments on push
- **Environment Management**: Built-in environment variable management
- **SSL Certificates**: Automatic HTTPS with Let's Encrypt
- **Health Checks**: Built-in monitoring and alerting

### Manual Docker
```bash
# Build image
docker build -t customer-call-tracker:latest .

# Run with environment variables
docker run -d \
  -p 80:80 \
  -e REACT_APP_SUPABASE_URL=your_url \
  -e REACT_APP_SUPABASE_ANON_KEY=your_key \
  --name customer-call-tracker \
  customer-call-tracker:latest
```

### Traditional Hosting
```bash
# Build static files
npm run build:prod

# Upload build/ directory to your web server
# Configure web server to serve index.html for all routes
```

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Environment Variables**: Secure configuration management
- **HTTPS Ready**: SSL/TLS configuration included
- **Security Headers**: Nginx configuration with security headers
- **CORS Configuration**: Proper cross-origin resource sharing

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check environment variables are properly set

**Supabase Connection Issues**
- Verify URL and anon key are correct
- Check RLS policies are configured
- Ensure CORS is set up for your domain

**Docker Issues**
- Check port 80 is not in use
- Verify environment variables are passed correctly
- Review container logs: `docker logs customer-call-tracker`

**Coolify Issues**
- Ensure all required environment variables are set
- Check build logs for specific error messages
- Verify repository is accessible from Coolify

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

For deployment support or questions:
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions
- Check the troubleshooting section above
- Review application logs in your deployment platform

---

**Ready for deployment!** 🚀 This application includes all necessary configuration files for Coolify, Docker, and traditional hosting platforms.
