# Zion Grocery Dashboard - Complete Setup & Run Guide

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **PostgreSQL**: Version 12 or higher
- **Windows**: Command Prompt (CMD) or PowerShell

### Check Prerequisites
```cmd
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if PostgreSQL is installed
psql --version
```

## 🚀 Step-by-Step Setup Guide

### Step 1: Navigate to Project Directory
```cmd
cd c:\Users\lewis\Desktop\zion-grocery-dashboard
```

### Step 2: Install Dependencies
```cmd
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Return to root directory
cd ..
```

### Step 3: Database Setup

#### Option A: Automated Database Setup (Recommended)
```cmd
# Run the database diagnostic and setup script
check-database-status.bat
```

#### Option B: Manual Database Setup
```cmd
# 1. Start PostgreSQL service (if not running)
net start postgresql-x64-14

# 2. Create database
createdb -U postgres zion_grocery_db

# 3. Run database migrations
cd backend
npm run migrate

# 4. Return to root
cd ..
```

### Step 4: Environment Configuration
Verify your `.env` file contains:
```env
NODE_ENV=development
PORT=5000
LOCAL_DATABASE_URL=postgresql://postgres:ZionGrocery2024!@localhost:5432/zion_grocery_db
```

### Step 5: Start the Application
```cmd
# Start the integrated server (serves both frontend and backend)
npm start
```

## 🌐 Accessing the Application

### Local Development URLs
- **Login Page**: http://localhost:5000/login.html
- **Dashboard**: http://localhost:5000 (after login)
- **API Health Check**: http://localhost:5000/health
- **API Base URL**: http://localhost:5000/api

### Default Login Credentials
- **Username**: ZionGroceries
- **Password**: Zion123$

Alternative credentials:
- admin / admin123
- manager / manager123
- cashier / cashier123

## 📊 Available NPM Scripts

### Root Level Scripts
```cmd
# Start the application (integrated server)
npm start

# Install all dependencies (root + backend)
npm run setup

# Run database migrations
npm run migrate

# Build for production
npm run build
```

### Backend Scripts
```cmd
cd backend

# Start backend server only
npm start

# Run database migrations
npm run migrate

# Setup database
npm run db:setup
```

## 🔧 Troubleshooting Common Issues

### Issue 1: 500 Internal Server Error
**Symptoms**: API requests fail with 500 error
**Cause**: Database connection failure

**Solution**:
```cmd
# Run diagnostic script
check-database-status.bat

# If PostgreSQL service not running:
net start postgresql-x64-14

# If database doesn't exist:
createdb -U postgres zion_grocery_db

# If tables don't exist:
cd backend
npm run migrate
```

### Issue 2: "Cannot connect to server"
**Symptoms**: Frontend can't reach backend
**Cause**: Backend server not running

**Solution**:
```cmd
# Check if server is running on port 5000
netstat -an | findstr :5000

# Start the server
npm start
```

### Issue 3: "Database connection required"
**Symptoms**: Dashboard shows empty data
**Cause**: PostgreSQL not running or misconfigured

**Solution**:
```cmd
# Check PostgreSQL service status
sc query postgresql-x64-14

# Start PostgreSQL if stopped
net start postgresql-x64-14

# Test database connection
cd backend
node -e "const db = require('./config/database'); db.raw('SELECT 1').then(() => console.log('✅ Connected')).catch(err => console.log('❌ Failed:', err.message))"
```

### Issue 4: Port Already in Use
**Symptoms**: "EADDRINUSE: address already in use :::5000"
**Cause**: Another process using port 5000

**Solution**:
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Or change port in .env file
# PORT=5001
```

## 🗄️ Database Management

### Check Database Status
```cmd
# Connect to PostgreSQL
psql -U postgres -d zion_grocery_db

# List all tables
\dt

# Check table data
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM sales;

# Exit PostgreSQL
\q
```

### Reset Database (if needed)
```cmd
# Drop and recreate database
dropdb -U postgres zion_grocery_db
createdb -U postgres zion_grocery_db

# Run migrations again
cd backend
npm run migrate
```

## 🔄 Development Workflow

### Daily Development Routine
```cmd
# 1. Navigate to project
cd c:\Users\lewis\Desktop\zion-grocery-dashboard

# 2. Check database status
check-database-status.bat

# 3. Start development server
npm start

# 4. Open browser to http://localhost:5000/login.html
```

### Making Changes
```cmd
# After making code changes, restart server
# Press Ctrl+C to stop server
# Then run:
npm start
```

## 📈 Production Deployment

### Render Deployment
The project is configured for Render deployment:
- **Live URL**: https://zion-grocery-dashboard-1.onrender.com
- **Database**: Render PostgreSQL
- **Environment**: Production mode

### Switch to Production Mode
```cmd
# Update .env file
# Change: NODE_ENV=development
# To: NODE_ENV=production

# The system will automatically use Render database
npm start
```

## 🆘 Emergency Recovery

### Complete System Reset
```cmd
# 1. Stop all processes
# Press Ctrl+C in any running terminals

# 2. Clean install
rmdir /s node_modules
rmdir /s backend\node_modules
npm install
cd backend
npm install
cd ..

# 3. Reset database
dropdb -U postgres zion_grocery_db
createdb -U postgres zion_grocery_db
npm run migrate

# 4. Start fresh
npm start
```

## 📞 Support Information

### System Architecture
- **Type**: Integrated Frontend/Backend Server
- **Port**: 5000 (configurable via .env)
- **Database**: PostgreSQL with Knex.js migrations
- **Frontend**: Vanilla JavaScript with SCSS
- **Real-time**: Socket.IO for live updates

### Key Files
- **Main Server**: `backend/server.js`
- **Database Config**: `backend/config/database.js`
- **Environment**: `.env`
- **Frontend Entry**: `frontend/index.html`

### Logs and Monitoring
- **Server Logs**: Console output when running `npm start`
- **Database Logs**: PostgreSQL logs in system event viewer
- **Browser Console**: F12 → Console tab for frontend errors
- **Health Check**: http://localhost:5000/health

---

**Note**: This guide assumes Windows environment with PostgreSQL installed. For other operating systems, adjust service commands accordingly.
