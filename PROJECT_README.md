# Zion Grocery Dashboard - Complete Project Documentation

A comprehensive grocery store management system with modern web technologies, featuring inventory management, sales tracking, expense monitoring, and debt management.

## 🏗️ **Project Architecture**

### **Frontend (Client-Side)**
- **Technology**: Vanilla JavaScript, HTML5, CSS3
- **Architecture**: Modular component-based design
- **UI Framework**: Custom CSS with responsive design
- **Charts**: Chart.js for analytics visualization
- **Storage**: localStorage (development) / API calls (production)

### **Backend (Server-Side)**
- **Technology**: Node.js with Express.js
- **Database**: PostgreSQL (production) / In-memory (development)
- **Authentication**: JWT-based with role-based access control
- **Caching**: Redis for dashboard analytics
- **API Design**: RESTful endpoints with comprehensive error handling

## 📁 **Project Structure**

```
zion-grocery-dashboard/
├── 📂 frontend/
│   ├── index.html                 # Main entry point
│   ├── 📂 partials/              # Modular HTML components
│   │   ├── sidebar.html          # Navigation sidebar
│   │   ├── dashboard.html        # Dashboard overview
│   │   ├── sales.html            # Sales management
│   │   ├── products.html         # Product inventory
│   │   ├── expenses.html         # Expense tracking
│   │   └── debts.html            # Debt management
│   ├── 📂 modals/                # Modal dialogs
│   │   ├── product-modal.html    # Add/Edit products
│   │   ├── sales-modal.html      # Process sales
│   │   ├── expense-modal.html    # Record expenses
│   │   └── debt-modal.html       # Manage debts
│   ├── 📂 scripts/               # JavaScript modules
│   │   ├── main.js               # Application initialization
│   │   ├── utils.js              # Utility functions
│   │   ├── navigation.js         # Page navigation
│   │   ├── dashboard.js          # Dashboard logic
│   │   ├── products.js           # Product management
│   │   ├── sales.js              # Sales processing
│   │   ├── expenses.js           # Expense handling
│   │   ├── debts.js              # Debt management
│   │   └── modals.js             # Modal interactions
│   └── 📂 styles/                # CSS styling
│       ├── css/main.css          # Compiled styles
│       └── scss/                 # SCSS source files
├── 📂 backend/
│   ├── server.js                 # Main Express server
│   ├── simple-server.js          # Simplified development server
│   ├── 📂 routes/                # API endpoints
│   │   ├── auth.js               # Authentication routes
│   │   ├── products.js           # Product CRUD operations
│   │   ├── sales.js              # Sales transactions
│   │   ├── expenses.js           # Expense management
│   │   ├── debts.js              # Debt tracking
│   │   ├── dashboard.js          # Analytics endpoints
│   │   ├── users.js              # User management
│   │   └── mpesa.js              # M-Pesa integration
│   ├── 📂 models/                # Data models
│   │   ├── Product.js            # Product model
│   │   ├── Sale.js               # Sales model
│   │   ├── Expense.js            # Expense model
│   │   └── Debt.js               # Debt model
│   ├── 📂 middleware/            # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Error handling
│   ├── 📂 migrations/            # Database schema
│   │   ├── 001_create_users_table.js
│   │   ├── 002_create_products_table.js
│   │   ├── 003_create_sales_table.js
│   │   ├── 004_create_expenses_table.js
│   │   ├── 005_create_debts_table.js
│   │   └── 006_create_debt_payments_table.js
│   ├── 📂 seeds/                 # Initial data
│   │   ├── 001_default_admin_user.js
│   │   └── 002_sample_products.js
│   └── 📂 config/                # Configuration
│       ├── database.js           # Database setup
│       └── redis.js              # Redis configuration
└── 📄 Documentation/
    ├── API_DOCUMENTATION.md      # Complete API reference
    ├── PROJECT_README.md         # This file
    └── DEPLOYMENT_GUIDE.md       # Production deployment
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 16+ installed
- PostgreSQL database (for production)
- Redis server (optional, for caching)
- Modern web browser

### **Quick Start**

1. **Clone/Download the project**
2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```
4. **Start development servers**:
   ```bash
   # Backend (in backend directory)
   node simple-server.js
   
   # Frontend (in project root)
   python -m http.server 8080
   # OR use VS Code Live Server extension
   ```
5. **Access the dashboard**: `http://localhost:8080`

### **Default Login**
- **Username**: `admin`
- **Password**: `admin123`

## 🔗 **Frontend-Backend Connection**

### **Development Mode**
- **Frontend**: `http://localhost:8080`
- **Backend API**: `http://localhost:5000`
- **Connection**: CORS enabled for cross-origin requests
- **Data Storage**: In-memory (simple-server.js) or localStorage

### **API Integration Points**
```javascript
// Frontend makes API calls to backend
const API_BASE = 'http://localhost:5000/api';

// Example API calls in frontend JavaScript
fetch(`${API_BASE}/products`)
  .then(response => response.json())
  .then(data => updateProductsTable(data));

fetch(`${API_BASE}/sales`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(saleData)
});
```

### **Authentication Flow**
1. User logs in via frontend form
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates and returns JWT token
4. Frontend stores token and includes in subsequent requests
5. Backend validates token for protected endpoints

## 📊 **Core Features**

### **Dashboard Analytics**
- Real-time sales statistics
- Revenue tracking and trends
- Low stock alerts
- Payment method distribution
- Weekly/monthly reports

### **Product Management**
- Add, edit, delete products
- Category organization
- Stock level monitoring
- Price management
- Barcode support (ready)

### **Sales Processing**
- Multi-payment method support (Cash, M-Pesa, Debt)
- Automatic stock updates
- Customer information tracking
- Sales history and reporting
- Receipt generation (ready)

### **Expense Tracking**
- Categorized expense recording
- Approval workflow system
- Monthly/yearly summaries
- Receipt attachment support (ready)

### **Debt Management**
- Customer debt tracking
- Payment history
- Overdue debt alerts
- Grouped customer views
- Payment processing

## 🔒 **Security Features**

### **Authentication & Authorization**
- JWT token-based authentication
- Role-based access control (Admin, Manager, Cashier)
- Password hashing with bcryptjs
- Session management

### **API Security**
- Rate limiting (100 requests/15 minutes)
- CORS configuration
- Input validation and sanitization
- SQL injection protection
- XSS prevention headers

### **Data Protection**
- Environment variable configuration
- Secure password storage
- Token expiration handling
- Error message sanitization

## 💾 **Data Backup & Recovery**

### **Database Backup (PostgreSQL)**

#### **Automated Daily Backups**
```bash
# Create backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres -d zion_grocery_dev > "backups/zion_grocery_$DATE.sql"

# Schedule with cron (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

#### **Manual Backup Commands**
```bash
# Full database backup
pg_dump -h localhost -U postgres -d zion_grocery_dev > backup.sql

# Restore from backup
psql -h localhost -U postgres -d zion_grocery_dev < backup.sql

# Backup specific tables
pg_dump -h localhost -U postgres -d zion_grocery_dev -t products -t sales > partial_backup.sql
```

### **Application Data Backup**

#### **Export Data via API**
```javascript
// Backup script to export all data
async function backupAllData() {
  const endpoints = ['products', 'sales', 'expenses', 'debts'];
  const backup = {};
  
  for (const endpoint of endpoints) {
    const response = await fetch(`/api/${endpoint}`);
    backup[endpoint] = await response.json();
  }
  
  // Save to file
  const blob = new Blob([JSON.stringify(backup, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zion_grocery_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}
```

#### **Cloud Storage Integration**
```javascript
// Example: Google Drive API integration
async function uploadToGoogleDrive(backupData) {
  const formData = new FormData();
  formData.append('file', new Blob([JSON.stringify(backupData)]));
  
  await fetch('https://www.googleapis.com/upload/drive/v3/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: formData
  });
}
```

### **Backup Strategy Recommendations**

#### **3-2-1 Backup Rule**
- **3 copies** of important data
- **2 different** storage media types
- **1 offsite** backup location

#### **Backup Schedule**
- **Hourly**: Critical transaction data
- **Daily**: Full database backup
- **Weekly**: Complete system backup
- **Monthly**: Archive to long-term storage

#### **Backup Locations**
1. **Local Server**: Immediate recovery
2. **Network Storage**: Redundancy protection
3. **Cloud Storage**: Disaster recovery
4. **External Drive**: Physical backup

### **Recovery Procedures**

#### **Database Recovery**
```bash
# Stop the application
sudo systemctl stop zion-grocery

# Restore database
psql -h localhost -U postgres -d zion_grocery_dev < backup_file.sql

# Restart application
sudo systemctl start zion-grocery
```

#### **Application Recovery**
```bash
# Restore application files
tar -xzf app_backup.tar.gz -C /path/to/application/

# Restore configuration
cp config_backup/.env /path/to/application/backend/

# Restart services
npm run start
```

## 🐘 **PostgreSQL Integration & Enterprise Features**

### **Database Architecture**

#### **Production Database Setup**
The system uses PostgreSQL for enterprise-grade data persistence with the following configuration:

```env
# PostgreSQL Configuration (.env)
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zion_grocery_db
DB_USER=postgres
DB_PASSWORD=ZionGrocery2024!
DB_POOL_MIN=2
DB_POOL_MAX=10
```

#### **Database Schema**
- **Users Table**: Authentication and role management
- **Products Table**: Inventory with UUID primary keys and indexing
- **Sales Table**: Transaction records with foreign key relationships
- **Expenses Table**: Expense tracking with approval workflows
- **Debts Table**: Customer debt management
- **Debt Payments Table**: Payment history tracking

#### **Performance Optimizations**
- **Connection Pooling**: Configurable pool size (2-10 connections)
- **Indexing Strategy**: Optimized indexes on frequently queried columns
- **Query Optimization**: Efficient JOIN operations and data retrieval
- **Partitioning**: Ready for table partitioning on large datasets

### **Automated Backup System**

#### **Enterprise Backup Features**
The system includes a comprehensive backup solution (`backup-system.js`):

```javascript
// Automated daily and weekly backups
const backupSchedule = {
  daily: '0 2 * * *',    // 2 AM daily
  weekly: '0 3 * * 0'    // 3 AM every Sunday
};

// Backup retention policy
const retentionPolicy = {
  daily: 7,    // Keep 7 daily backups
  weekly: 4,   // Keep 4 weekly backups
  monthly: 12  // Keep 12 monthly backups
};
```

#### **Backup Features**
- **Automated Scheduling**: Cron-based daily/weekly backups
- **Retention Management**: Automatic cleanup of old backups
- **Compression**: Gzip compression for storage efficiency
- **Error Handling**: Comprehensive error logging and notifications
- **Multiple Formats**: SQL dumps and JSON exports

### **Data Archival System**

#### **Long-term Data Management**
The archival system (`data-archival.js`) provides:

```javascript
// Monthly archival process
const archivalConfig = {
  schedule: '0 1 1 * *',  // 1st day of month at 1 AM
  retentionMonths: 12,    // Keep 12 months in main tables
  archiveLocation: './archives/',
  compressionLevel: 9
};
```

#### **Archival Features**
- **Automated Monthly Archival**: Moves old data to archive tables
- **Table Partitioning**: Implements date-based partitioning
- **Performance Analysis**: Automatic ANALYZE after archival
- **Archive Compression**: Reduces storage requirements
- **Data Integrity**: Maintains referential integrity during archival

### **Enterprise Logging**

#### **Winston Logger Integration**
Professional logging system (`backend/utils/logger.js`):

```javascript
// Log levels and formats
const logConfig = {
  levels: ['error', 'warn', 'info', 'debug'],
  format: 'JSON with timestamps',
  transports: ['file', 'console'],
  rotation: 'daily'
};
```

#### **Logging Features**
- **Structured Logging**: JSON format with metadata
- **Log Rotation**: Daily log file rotation
- **Error Tracking**: Separate error log files
- **Performance Monitoring**: Request/response time logging
- **Debug Support**: Configurable debug levels

### **Quick PostgreSQL Setup**

#### **Automated Setup Script**
Use the provided `setup-postgres.bat` for Windows:

```batch
# Run the setup script
./setup-postgres.bat

# This will:
# 1. Create the PostgreSQL database
# 2. Install Node.js dependencies
# 3. Run database migrations
# 4. Seed initial data
# 5. Start the production server
```

#### **Manual PostgreSQL Setup**
```sql
-- 1. Create database
CREATE DATABASE zion_grocery_db;

-- 2. Create backup user (optional)
CREATE USER zion_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE zion_grocery_db TO zion_backup;
GRANT USAGE ON SCHEMA public TO zion_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zion_backup;

-- 3. Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

#### **Database Migration Commands**
```bash
# Navigate to backend directory
cd backend

# Run all migrations
npx knex migrate:latest

# Run specific migration
npx knex migrate:up 001_create_users_table.js

# Rollback last migration
npx knex migrate:rollback

# Seed initial data
npx knex seed:run
```

### **Enterprise Security Features**

#### **Database Security**
- **Connection Encryption**: SSL/TLS support
- **User Permissions**: Role-based database access
- **Backup Security**: Encrypted backup files
- **Audit Logging**: Database activity tracking

#### **Application Security**
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API request throttling
- **Input Validation**: SQL injection prevention
- **CORS Configuration**: Cross-origin request control

### **Monitoring & Health Checks**

#### **Database Monitoring**
```javascript
// Health check endpoints
GET /api/health/database  // Database connection status
GET /api/health/redis     // Redis connection status
GET /api/health/system    // Overall system health
```

#### **Performance Metrics**
- **Connection Pool Status**: Active/idle connections
- **Query Performance**: Slow query identification
- **Storage Usage**: Database size monitoring
- **Backup Status**: Last backup timestamp and size

## 🌐 **Production Deployment**

### **Environment Setup**
```env
# Production .env configuration
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=zion_grocery_prod
JWT_SECRET=your_super_secure_jwt_secret
REDIS_HOST=your_redis_host
```

### **Server Requirements**
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB+ SSD
- **Network**: Stable internet connection
- **OS**: Ubuntu 20.04+ or CentOS 8+

### **Deployment Steps**
1. Set up production server
2. Install Node.js, PostgreSQL, Redis
3. Clone application code
4. Configure environment variables
5. Run database migrations
6. Set up SSL certificates
7. Configure reverse proxy (Nginx)
8. Set up monitoring and logging

## 🔧 **Maintenance & Monitoring**

### **Health Checks**
- **API Health**: `GET /health`
- **Database Connection**: Monitor connection pool
- **Redis Status**: Cache performance metrics
- **Disk Space**: Storage utilization
- **Memory Usage**: Application performance

### **Logging Strategy**
- **Application Logs**: Express.js with Morgan
- **Error Logs**: Centralized error tracking
- **Access Logs**: User activity monitoring
- **Performance Logs**: Response time tracking

### **Update Procedures**
1. **Backup current system**
2. **Test updates in staging**
3. **Schedule maintenance window**
4. **Deploy with rollback plan**
5. **Verify functionality**
6. **Monitor for issues**

## 🔧 **Detailed Setup Instructions**

### **Step-by-Step Installation Guide**

#### **1. System Prerequisites**
```bash
# Check Node.js version (16+ required)
node --version

# Check npm version
npm --version

# Check PostgreSQL installation
psql --version
```

#### **2. Project Setup**
```bash
# Clone or download the project
git clone <repository-url>
cd zion-grocery-dashboard

# Install backend dependencies
cd backend
npm install

# Install additional dependencies if needed
npm install winston knex pg bcryptjs jsonwebtoken
```

#### **3. Database Configuration**
```bash
# Option A: Use automated setup script (Windows)
./setup-postgres.bat

# Option B: Manual setup
# Create database
createdb -U postgres zion_grocery_db

# Run migrations
cd backend
npx knex migrate:latest

# Seed initial data
npx knex seed:run
```

#### **4. Environment Configuration**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit .env file with your settings
# Required variables:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET (generate a secure random string)
# - NODE_ENV (development/production)
```

#### **5. Start the Application**
```bash
# Start backend server
cd backend
node simple-server.js  # Development
# OR
node server.js         # Production

# Start frontend server (separate terminal)
cd ..
python -m http.server 8080
# OR use VS Code Live Server extension
```

#### **6. Verify Installation**
- **Frontend**: Navigate to `http://localhost:8080`
- **Backend API**: Test `http://localhost:5000/api/health`
- **Login**: Use default credentials (admin/admin123)

### **Configuration Options**

#### **Database Configuration**
```javascript
// backend/config/database.js
module.exports = {
  development: {
    client: 'sqlite3',
    connection: { filename: './dev.sqlite3' }
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true'
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    }
  }
};
```

#### **Server Configuration**
```javascript
// backend/server.js configuration options
const config = {
  port: process.env.PORT || 5000,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
};
```

## 📞 **Support & Troubleshooting**

### **Common Issues & Solutions**

#### **Database Connection Issues**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solutions:**
1. **Check PostgreSQL Service**:
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # Linux/Mac
   sudo systemctl start postgresql
   ```

2. **Verify Database Exists**:
   ```bash
   psql -U postgres -l | grep zion_grocery_db
   ```

3. **Check Connection Settings**:
   ```bash
   # Test connection manually
   psql -h localhost -U postgres -d zion_grocery_db
   ```

4. **Common Fixes**:
   - Ensure PostgreSQL is running
   - Check `.env` file credentials
   - Verify database name exists
   - Check firewall settings

#### **CORS Errors**
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:8080' has been blocked by CORS policy
```
**Solutions:**
1. **Check Backend CORS Configuration**:
   ```javascript
   // Ensure CORS is properly configured
   app.use(cors({
     origin: 'http://localhost:8080',
     credentials: true
   }));
   ```

2. **Verify Frontend API Base URL**:
   ```javascript
   // Check API_BASE in frontend scripts
   const API_BASE = 'http://localhost:5000/api';
   ```

3. **Development vs Production URLs**:
   - Development: `http://localhost:8080` → `http://localhost:5000`
   - Production: Update URLs in `.env` file

#### **Authentication Issues**
```
Error: jwt malformed / Token expired
```
**Solutions:**
1. **Check JWT Secret**:
   ```bash
   # Ensure JWT_SECRET is set in .env
   JWT_SECRET=your-super-secure-secret-key-here
   ```

2. **Clear Browser Storage**:
   ```javascript
   // Clear localStorage in browser console
   localStorage.clear();
   ```

3. **Verify Token Format**:
   ```javascript
   // Check token in browser localStorage
   console.log(localStorage.getItem('token'));
   ```

#### **Migration Errors**
```
Error: Migration table is already locked
```
**Solutions:**
1. **Unlock Migration Table**:
   ```bash
   npx knex migrate:unlock
   ```

2. **Reset Migrations** (Development only):
   ```bash
   npx knex migrate:rollback --all
   npx knex migrate:latest
   ```

3. **Check Migration Files**:
   ```bash
   # List migration status
   npx knex migrate:status
   ```

#### **Performance Issues**
```
Slow API responses / High memory usage
```
**Solutions:**
1. **Enable Connection Pooling**:
   ```javascript
   // Increase pool size in database config
   pool: { min: 2, max: 20 }
   ```

2. **Add Database Indexes**:
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_sales_date ON sales(created_at);
   CREATE INDEX idx_products_category ON products(category);
   ```

3. **Enable Redis Caching**:
   ```bash
   # Install and start Redis
   npm install redis
   # Configure Redis in .env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### **Debug Mode & Logging**

#### **Enable Debug Logging**
```bash
# Development mode with full debugging
NODE_ENV=development DEBUG=* node server.js

# Production mode with error logging only
NODE_ENV=production LOG_LEVEL=error node server.js
```

#### **Log File Locations**
```bash
# Backend logs
backend/logs/combined.log    # All logs
backend/logs/error.log       # Error logs only

# View recent logs
tail -f backend/logs/combined.log
```

#### **Database Query Debugging**
```javascript
// Enable query logging in database config
debug: true,
log: {
  warn(message) { console.log('DB Warning:', message); },
  error(message) { console.log('DB Error:', message); },
  debug(message) { console.log('DB Debug:', message); }
}
```

### **Performance Optimization**

#### **Database Optimization**
```sql
-- Analyze table statistics
ANALYZE products;
ANALYZE sales;
ANALYZE expenses;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### **Application Optimization**
```javascript
// Enable gzip compression
app.use(compression());

// Implement caching
const cache = require('memory-cache');
app.get('/api/dashboard', (req, res) => {
  const cached = cache.get('dashboard');
  if (cached) return res.json(cached);
  
  // Generate data and cache for 5 minutes
  const data = generateDashboardData();
  cache.put('dashboard', data, 5 * 60 * 1000);
  res.json(data);
});
```

#### **Frontend Optimization**
```javascript
// Implement debouncing for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Use for search inputs
const debouncedSearch = debounce(searchProducts, 300);
```

### **Backup & Recovery Procedures**

#### **Emergency Database Recovery**
```bash
# Stop application
sudo systemctl stop zion-grocery

# Restore from latest backup
psql -U postgres -d zion_grocery_db < backups/latest_backup.sql

# Restart application
sudo systemctl start zion-grocery
```

#### **Data Corruption Recovery**
```bash
# Check database integrity
psql -U postgres -d zion_grocery_db -c "SELECT pg_database_size('zion_grocery_db');"

# Repair if needed
psql -U postgres -d zion_grocery_db -c "REINDEX DATABASE zion_grocery_db;"
```

### **Monitoring & Health Checks**

#### **System Health Endpoints**
```bash
# Check API health
curl http://localhost:5000/api/health

# Check database connection
curl http://localhost:5000/api/health/database

# Check system resources
curl http://localhost:5000/api/health/system
```

#### **Performance Monitoring**
```bash
# Monitor server resources
top -p $(pgrep node)

# Monitor database connections
psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE datname='zion_grocery_db';"

# Check disk usage
df -h
```

---

## 🔌 **API Documentation**

### **Authentication Endpoints**

#### **POST /api/auth/login**
Authenticate user and receive JWT token.

```javascript
// Request
{
  "username": "admin",
  "password": "admin123"
}

// Response (Success)
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Response (Error)
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### **POST /api/auth/logout**
Invalidate current session token.

```javascript
// Headers
Authorization: Bearer <token>

// Response
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Product Management Endpoints**

#### **GET /api/products**
Retrieve all products with optional filtering.

```javascript
// Query Parameters (optional)
?category=beverages&inStock=true&limit=50&offset=0

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Coca Cola 500ml",
      "category": "beverages",
      "price": 50.00,
      "stock": 100,
      "minStock": 10,
      "barcode": "1234567890",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### **POST /api/products**
Create a new product.

```javascript
// Request
{
  "name": "New Product",
  "category": "groceries",
  "price": 25.50,
  "stock": 50,
  "minStock": 5,
  "barcode": "9876543210"
}

// Response
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "name": "New Product",
    // ... other fields
  }
}
```

#### **PUT /api/products/:id**
Update existing product.

#### **DELETE /api/products/:id**
Delete a product.

### **Sales Management Endpoints**

#### **GET /api/sales**
Retrieve sales records with filtering options.

```javascript
// Query Parameters
?startDate=2024-01-01&endDate=2024-01-31&paymentMethod=cash&limit=100

// Response
{
  "success": true,
  "data": [
    {
      "id": "sale-uuid",
      "productId": "product-uuid",
      "productName": "Coca Cola 500ml",
      "quantity": 2,
      "unitPrice": 50.00,
      "total": 100.00,
      "paymentMethod": "cash",
      "customerName": "John Doe",
      "customerPhone": "+254700000000",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "totalSales": 15000.00,
    "totalTransactions": 150,
    "averageTransaction": 100.00
  }
}
```

#### **POST /api/sales**
Process a new sale.

```javascript
// Request
{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 50.00
    }
  ],
  "paymentMethod": "cash",
  "customerName": "John Doe",
  "customerPhone": "+254700000000",
  "discount": 0.00
}

// Response
{
  "success": true,
  "data": {
    "saleId": "new-sale-uuid",
    "total": 100.00,
    "receipt": {
      "receiptNumber": "RCP-001",
      "items": [...],
      "total": 100.00,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### **Expense Management Endpoints**

#### **GET /api/expenses**
Retrieve expense records.

```javascript
// Query Parameters
?category=utilities&status=approved&month=2024-01

// Response
{
  "success": true,
  "data": [
    {
      "id": "expense-uuid",
      "description": "Electricity Bill",
      "category": "utilities",
      "amount": 5000.00,
      "status": "approved",
      "approvedBy": "admin",
      "receiptUrl": "/uploads/receipt-123.jpg",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### **POST /api/expenses**
Record a new expense.

```javascript
// Request (multipart/form-data for file upload)
{
  "description": "Office Supplies",
  "category": "office",
  "amount": 2500.00,
  "receipt": <file>
}
```

### **Debt Management Endpoints**

#### **GET /api/debts**
Retrieve customer debts.

```javascript
// Query Parameters
?status=outstanding&customerId=customer-uuid

// Response
{
  "success": true,
  "data": [
    {
      "id": "debt-uuid",
      "customerId": "customer-uuid",
      "customerName": "Jane Doe",
      "customerPhone": "+254700000001",
      "totalAmount": 1500.00,
      "paidAmount": 500.00,
      "remainingAmount": 1000.00,
      "status": "outstanding",
      "dueDate": "2024-02-15T00:00:00Z",
      "createdAt": "2024-01-15T00:00:00Z",
      "payments": [
        {
          "id": "payment-uuid",
          "amount": 500.00,
          "paymentDate": "2024-01-20T00:00:00Z",
          "method": "cash"
        }
      ]
    }
  ]
}
```

#### **POST /api/debts/:id/payments**
Record a debt payment.

```javascript
// Request
{
  "amount": 300.00,
  "paymentMethod": "mpesa",
  "reference": "MPE123456789"
}
```

### **Dashboard Analytics Endpoints**

#### **GET /api/dashboard/stats**
Retrieve dashboard statistics.

```javascript
// Response
{
  "success": true,
  "data": {
    "todaySales": {
      "total": 15000.00,
      "transactions": 45,
      "growth": 12.5
    },
    "totalProducts": 250,
    "lowStockProducts": 8,
    "outstandingDebts": 25000.00,
    "monthlyRevenue": {
      "current": 450000.00,
      "previous": 420000.00,
      "growth": 7.1
    },
    "paymentMethods": {
      "cash": 60.5,
      "mpesa": 35.2,
      "debt": 4.3
    },
    "topProducts": [
      {
        "name": "Coca Cola 500ml",
        "sales": 150,
        "revenue": 7500.00
      }
    ]
  }
}
```

#### **GET /api/dashboard/charts**
Retrieve chart data for dashboard.

```javascript
// Query Parameters
?period=7days&type=sales

// Response
{
  "success": true,
  "data": {
    "salesTrend": {
      "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "data": [1200, 1800, 1500, 2200, 1900, 2500, 2100]
    },
    "categoryDistribution": {
      "labels": ["Beverages", "Groceries", "Snacks"],
      "data": [45.2, 32.8, 22.0]
    }
  }
}
```

### **Health Check Endpoints**

#### **GET /api/health**
Basic health check.

```javascript
// Response
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400
}
```

#### **GET /api/health/database**
Database connection health.

```javascript
// Response
{
  "success": true,
  "database": {
    "status": "connected",
    "responseTime": 15,
    "activeConnections": 3,
    "maxConnections": 10
  }
}
```

### **Error Response Format**

All API endpoints follow a consistent error response format:

```javascript
// 4xx Client Errors
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "price",
      "issue": "Price must be a positive number"
    }
  }
}

// 5xx Server Errors
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req-uuid-here"
  }
}
```

### **Authentication Requirements**

Most endpoints require JWT authentication:

```javascript
// Headers
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### **Rate Limiting**

API endpoints are rate-limited:
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 requests per hour

## 🎯 **Future Enhancements**

- **Mobile App**: React Native or Flutter
- **Advanced Analytics**: Business intelligence dashboard
- **Multi-location Support**: Branch management
- **Supplier Integration**: Purchase order automation
- **Customer Portal**: Online ordering system
- **Barcode Scanning**: Mobile barcode integration
- **Automated Reporting**: Scheduled email reports

---

**Zion Grocery Dashboard** - Built for efficient grocery store management with modern web technologies and comprehensive data protection strategies.
