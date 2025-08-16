# Zion Grocery Dashboard - Backend API

A comprehensive Node.js/Express.js backend API for the Zion Grocery Dashboard application, providing complete inventory management, sales tracking, expense management, and debt management functionality.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Product Management**: Full CRUD operations with stock tracking and low stock alerts
- **Sales Management**: Transaction processing with multiple payment methods (Cash, M-Pesa, Debt)
- **Expense Tracking**: Expense management with approval workflow
- **Debt Management**: Customer debt tracking with payment history
- **Dashboard Analytics**: Real-time statistics and charts with Redis caching
- **M-Pesa Integration**: STK Push and payment validation
- **User Management**: Admin panel for user management
- **Database Migrations**: Automated schema management with Knex.js

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Database ORM**: Knex.js
- **API Documentation**: Comprehensive REST API

## Quick Start

### Prerequisites

- Node.js 16+ installed
- PostgreSQL database running
- Redis server running (optional, for caching)

### Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and configuration details
   ```

4. **Database Setup**:
   ```bash
   # Run migrations
   npm run migrate

   # Seed initial data (creates admin user and sample products)
   npm run seed
   ```

5. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

### Default Admin Credentials

After running seeds:
- **Username**: `admin`
- **Email**: `admin@ziongrocery.com`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/categories` - Get categories
- `GET /api/products/low-stock` - Get low stock products

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/summary` - Get sales summary
- `GET /api/sales/daily` - Get daily sales
- `GET /api/sales/top-products` - Get top products

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/summary` - Get expenses summary
- `PATCH /api/expenses/:id/approve` - Approve expense
- `PATCH /api/expenses/:id/reject` - Reject expense

### Debts
- `GET /api/debts` - Get all debts
- `POST /api/debts` - Create debt
- `GET /api/debts/grouped` - Get grouped debts
- `GET /api/debts/overdue` - Get overdue debts
- `POST /api/debts/:id/payments` - Record payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts` - Get chart data
- `GET /api/dashboard/alerts` - Get system alerts

### M-Pesa Integration
- `POST /api/mpesa/stk-push` - Initiate STK Push
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `GET /api/mpesa/transaction-status/:id` - Check transaction status

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Schema

### Tables
- **users** - User accounts with roles
- **products** - Product inventory
- **sales** - Sales transactions
- **expenses** - Business expenses
- **debts** - Customer debts
- **debt_payments** - Debt payment history

### Roles
- **admin** - Full system access
- **manager** - Can approve expenses, manage inventory
- **cashier** - Can process sales, view reports

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zion_grocery_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# M-Pesa Configuration (Optional)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server

# Database
npm run migrate     # Run database migrations
npm run migrate:rollback  # Rollback last migration
npm run seed        # Run database seeds
npm run db:reset    # Reset database (rollback + migrate + seed)

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode

# Database Management
npm run knex       # Access Knex CLI
```

## Project Structure

```
backend/
├── config/
│   ├── database.js      # Database configuration
│   └── redis.js         # Redis configuration
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── errorHandler.js  # Error handling middleware
├── migrations/          # Database migrations
├── models/              # Data models
│   ├── Product.js
│   ├── Sale.js
│   ├── Expense.js
│   └── Debt.js
├── routes/              # API routes
│   ├── auth.js
│   ├── products.js
│   ├── sales.js
│   ├── expenses.js
│   ├── debts.js
│   ├── dashboard.js
│   ├── users.js
│   └── mpesa.js
├── seeds/               # Database seeds
├── server.js            # Main server file
├── knexfile.js         # Knex configuration
└── package.json
```

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs with salt rounds
- **Rate Limiting** to prevent API abuse
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Input Validation** using Joi
- **SQL Injection Protection** via parameterized queries
- **Role-based Access Control** for endpoints

## Caching Strategy

- **Dashboard Statistics**: Cached for 5 minutes
- **Chart Data**: Cached for 10 minutes
- **Redis Integration**: Automatic cache invalidation
- **Performance Optimization**: Reduced database queries

## Error Handling

- **Centralized Error Handler**: Consistent error responses
- **Custom Error Classes**: Structured error handling
- **Validation Errors**: Detailed field-level validation
- **HTTP Status Codes**: Proper status code usage
- **Environment-based Responses**: Detailed errors in development

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure Redis for production
5. Set up SSL/HTTPS
6. Configure M-Pesa production credentials
7. Set up monitoring and logging

### Docker Support

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Check the API documentation in `API_DOCUMENTATION.md`
- Review the code comments and examples
- Create an issue for bugs or feature requests

---

**Zion Grocery Dashboard Backend** - Built with ❤️ for efficient grocery store management
