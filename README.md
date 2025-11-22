# Customer Call Tracker v2.0

A modern, responsive customer call management system built with React and Supabase. Features an intuitive dashboard for tracking customer interactions, follow-ups, and call dispositions with advanced filtering, bulk data import, and timeline views.

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/modidiviyansh/customer-call-tracker)
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://modidiviyansh.github.io/customer-call-tracker/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)

## ✨ **Version 2.0 Features**

### 📊 **Enhanced Dashboard & Analytics**
- **Real-time Statistics**: View call metrics and performance indicators
- **Today's Calls Tab**: See only the latest call record per customer for today's followup dates
- **Historical Timeline**: Complete call history for audit and disposition tracking
- **Smart Deduplication**: Automatically groups multiple call records by customer and date
- **Performance Analytics**: Track success rates, response times, and conversion metrics

### 📅 **Advanced Reminder System**
- **Sticky Segment Navigation**: Overdue, Today, and This Week tabs with smooth animations
- **Multi-Select Filtering**: Filter by disposition status with beautiful filter pills
- **Glassmorphism Design**: Modern frosted glass UI with backdrop blur effects
- **Timeline Modal**: Complete call history with latest call prominently displayed
- **Smart Scheduling**: Automatic follow-up date suggestions based on call outcomes

### 📋 **🚀 Production CSV Import System**
- **Bulk Customer Import**: Import up to 1000+ customers via CSV files
- **Bulk Reminder Import**: Import thousands of reminders with customer mobile lookup
- **Batch Processing**: Optimized 50-record batches for memory efficiency
- **Smart Validation**: Real-time CSV validation with field mapping
- **Template Downloads**: One-click CSV template generation
- **Error Recovery**: Individual record failures don't stop the entire import
- **Progress Tracking**: Real-time import progress with success/failure reporting
- **Duplicate Detection**: Smart detection of existing customers to prevent duplicates

### 📱 **Mobile-First UI/UX**
- **Responsive Design**: Optimized for mobile and desktop
- **Touch-Friendly**: 44px minimum touch targets for mobile interaction
- **Fixed Button Sizes**: Optimized button and card sizes for mobile screens
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Loading States**: Shimmer effects and smooth transitions
- **Gesture Support**: Swipe and tap optimizations for mobile devices

### 🔐 **Authentication & Security**
- **PIN-based Authentication**: Secure access with PIN code entry
- **Agent Tracking**: Track calls by agent PIN for accountability
- **Row Level Security**: Supabase RLS for data protection
- **Session Management**: Secure session handling and automatic timeouts

### 🎨 **Modern Design System**
- **Glassmorphism Cards**: Beautiful frosted glass UI elements
- **Custom Gradients**: Eye-catching gradient backgrounds and buttons
- **Typography**: Clean, readable font hierarchy
- **Color Palette**: Professional blue and teal gradient scheme
- **Dark Mode Ready**: Structure prepared for future dark theme

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### **Live Demo**
Visit the live application: [https://modidiviyansh.github.io/customer-call-tracker/](https://modidiviyansh.github.io/customer-call-tracker/)

### Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/modidiviyansh/customer-call-tracker.git
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

## 📋 **CSV Import Guide**

### **Customer Import Format**
Create a CSV file with the following columns:
```csv
name,mobile
John Doe,9876543210
Jane Smith,8765432109
Raj Patel,7654321098
```

### **Reminder Import Format**
Create a CSV file with the following columns:
```csv
customer_mobile,reminder_text,reminder_date
9876543210,Follow up call,2025-01-15
8765432109,Product demo,2025-01-20
```

### **Import Process**
1. Click "Import Customers" or "Import Reminders"
2. Download the CSV template
3. Fill in your data using the template format
4. Upload your CSV file
5. Review the data preview
6. Click "Import" to process

## 📁 **Project Structure**

```
customer-call-tracker/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Button.js          # Enhanced button components
│   │   ├── CallDisposition.js # Call logging interface
│   │   ├── Reminders.js       # Advanced reminder system
│   │   ├── CSVImport.js       # Bulk import component
│   │   └── ...
│   ├── pages/                 # Route components
│   │   ├── Dashboard.js       # Main dashboard
│   │   └── HomePage.js        # Landing page
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCustomerData.js
│   │   ├── useApi.js
│   │   └── usePinAuth.js
│   ├── services/              # API and external services
│   │   └── supabase.js        # Supabase configuration
│   ├── utils/                 # Utility functions
│   │   ├── validation.js      # Input validation
│   │   └── mockData.js        # Mock data for testing
│   └── index.css              # Global styles and design system
├── database/                   # Database schema and migrations
│   ├── schema.sql             # Main database schema
│   ├── final_schema.sql       # Updated schema
│   └── supabase-sql-run.sql   # Complete schema
├── .github/                    # GitHub configuration
│   └── workflows/             # GitHub Actions workflows
│       ├── main.yml           # Main deployment workflow
│       └── deploy.yml         # GitHub Pages deployment
├── CSV_IMPORT_GUIDE.md       # Detailed CSV import documentation
├── DEPLOYMENT.md             # Detailed deployment guide
└── nixpacks.toml              # Nixpacks configuration
```

## 🛠️ **Available Scripts**

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
npm run build:prod # Production build (optimized)
npm run deploy     # Deploy to GitHub Pages
```

## 🌐 **GitHub Pages Deployment**

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

### **Automatic Deployment (Recommended)**

1. **Enable GitHub Pages**
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Set up Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Deploy**
   - Push to the `main` or `gh-page` branch
   - GitHub Actions will automatically build and deploy
   - Your site will be available at: `https://modidiviyansh.github.io/customer-call-tracker`

### **Version Management**
- **v1.0**: Original stable release
- **v2.0**: Current stable release with CSV import and mobile improvements
- **v3-development**: Development branch for upcoming features

## 🎯 **Key Components**

### **CSVImport Component**
- **Template Generation**: Dynamic CSV templates based on import type
- **File Validation**: Real-time validation of CSV format and content
- **Progress Tracking**: Visual progress indicators during import
- **Error Handling**: Comprehensive error reporting and recovery
- **Batch Processing**: Efficient handling of large datasets

### **Reminders Component**
- **Sticky Navigation**: Segment tabs that stay visible while scrolling
- **Multi-Select Filters**: Beautiful filter pills for disposition filtering
- **Glassmorphism Cards**: Modern design with backdrop blur effects
- **Timeline Modal**: Complete customer call history

### **Dashboard Component**  
- **Statistics Cards**: Key metrics and performance indicators
- **Today's Calls**: Latest record per customer (deduplicated)
- **Historical Timeline**: Full call history for audit purposes
- **Responsive Layout**: Mobile-first design with proper touch targets

## 🔧 **Configuration**

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
5. Run the provided SQL schema files

## 📊 **Performance & Scalability**

### **Large Dataset Support**
- **Memory Efficient**: Batch processing prevents memory overflow
- **Optimized Queries**: Database queries optimized for large datasets
- **Progressive Loading**: Smart loading strategies for better UX
- **Client-Side Caching**: Intelligent caching for better performance

### **Mobile Optimization**
- **Fast Loading**: Optimized bundle sizes for mobile
- **Touch Gestures**: Native-like touch interactions
- **Offline Ready**: Service worker support (future feature)

## 🐛 **Troubleshooting**

### Common Issues

**Build Failures**
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check environment variables are properly set

**CSV Import Issues**
- Ensure CSV files use UTF-8 encoding
- Check column headers match expected format exactly
- Verify mobile numbers are 10 digits (6-9 prefix)

**Supabase Connection Issues**
- Verify URL and anon key are correct
- Check RLS policies are configured
- Ensure CORS is set up for your domain

## 📈 **Version History**

### **v2.0 (Current) - 2025-01-11**
- ✨ **NEW**: Bulk CSV import for customers and reminders
- ✨ **NEW**: Production-ready batch processing (1000+ records)
- ✨ **NEW**: Mobile UI/UX improvements (button sizes, touch targets)
- ✨ **NEW**: CSV template downloads
- ✨ **NEW**: Real-time import progress tracking
- 🔧 **FIX**: ESLint warnings resolved for deployment
- 🚀 **IMPROVE**: Memory-efficient large dataset handling

### **v1.0 - Initial Release**
- ✅ Basic customer call tracking
- ✅ Reminder system with filtering
- ✅ Dashboard with analytics
- ✅ Supabase integration
- ✅ GitHub Pages deployment

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

1. **Development Branch**: Use `v3-development` for new features
2. **Fork the repository**
3. **Create a feature branch**: `git checkout -b feature-name`
4. **Commit changes**: `git commit -am 'Add feature'`
5. **Push to branch**: `git push origin feature-name`
6. **Submit a pull request** to `main` or `v3-development`

## 📞 **Support**

- 📖 **Documentation**: [CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)
- 🚀 **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

## 🎉 **Credits**

Built with ❤️ using:
- **React** - Modern UI library
- **Supabase** - Backend-as-a-Service
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide Icons** - Beautiful icon set

---

**Ready for production deployment!** 🚀 This application includes all necessary configuration files for modern hosting platforms and is optimized for both desktop and mobile usage.

**Live Demo**: [https://modidiviyansh.github.io/customer-call-tracker/](https://modidiviyansh.github.io/customer-call-tracker/)
