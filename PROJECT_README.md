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

## 📞 **Support & Troubleshooting**

### **Common Issues**
- **Database Connection**: Check credentials and network
- **CORS Errors**: Verify frontend-backend URLs
- **Authentication Issues**: Check JWT token validity
- **Performance Problems**: Monitor database queries

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* node server.js
```

### **Performance Optimization**
- Enable Redis caching
- Optimize database queries
- Implement connection pooling
- Use CDN for static assets
- Enable gzip compression

---

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
