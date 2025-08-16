# Zion Grocery Dashboard API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {...},
  "error": "Error details (if any)"
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user.
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin|manager|cashier" // optional, defaults to cashier
}
```

### POST /auth/login
Login user and get JWT token.
```json
{
  "username": "string", // can be username or email
  "password": "string"
}
```

### POST /auth/refresh
Refresh JWT token (requires authentication).

### GET /auth/profile
Get current user profile (requires authentication).

### PUT /auth/profile
Update user profile (requires authentication).
```json
{
  "username": "string", // optional
  "email": "string" // optional
}
```

### PUT /auth/change-password
Change user password (requires authentication).
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

## Products Endpoints

### GET /products
Get all products with optional filtering.
Query parameters:
- `category`: Filter by category
- `low_stock`: true/false - Get low stock products only
- `search`: Search by name

### GET /products/:id
Get product by ID.

### POST /products
Create new product (requires authentication).
```json
{
  "name": "string",
  "category": "string",
  "price": "number",
  "stock": "number",
  "min_stock": "number", // optional
  "description": "string", // optional
  "barcode": "string", // optional
  "supplier": "string", // optional
  "cost_price": "number" // optional
}
```

### PUT /products/:id
Update product (requires authentication).

### DELETE /products/:id
Delete product (requires authentication).

### GET /products/categories
Get all product categories.

### GET /products/low-stock
Get products with low stock.

### PATCH /products/:id/stock
Update product stock (requires authentication).
```json
{
  "stock": "number",
  "operation": "set|add|subtract" // optional, defaults to set
}
```

---

## Sales Endpoints

### GET /sales
Get all sales with optional filtering.
Query parameters:
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `payment_method`: cash|mpesa|debt
- `status`: completed|pending|cancelled

### GET /sales/:id
Get sale by ID.

### POST /sales
Create new sale (requires authentication).
```json
{
  "product_id": "string",
  "quantity": "number",
  "payment_method": "cash|mpesa|debt",
  "customer_name": "string", // required for debt/mpesa
  "customer_phone": "string", // optional
  "mpesa_code": "string", // required for mpesa
  "notes": "string" // optional
}
```

### PUT /sales/:id
Update sale (requires authentication).

### DELETE /sales/:id
Delete sale (requires authentication).

### GET /sales/summary
Get sales summary with totals.
Query parameters:
- `date_from`: Start date
- `date_to`: End date

### GET /sales/daily
Get daily sales for specified number of days.
Query parameters:
- `days`: Number of days (default: 7)

### GET /sales/top-products
Get top selling products.
Query parameters:
- `limit`: Number of products (default: 10)

### PATCH /sales/:id/status
Update sale status (requires authentication).
```json
{
  "status": "completed|pending|cancelled"
}
```

---

## Expenses Endpoints

### GET /expenses
Get all expenses with optional filtering.
Query parameters:
- `category`: Filter by category
- `status`: pending|approved|rejected
- `date_from`: Start date
- `date_to`: End date

### GET /expenses/:id
Get expense by ID.

### POST /expenses
Create new expense (requires authentication).
```json
{
  "description": "string",
  "amount": "number",
  "category": "string",
  "expense_date": "YYYY-MM-DD",
  "receipt_number": "string", // optional
  "notes": "string" // optional
}
```

### PUT /expenses/:id
Update expense (requires authentication).

### DELETE /expenses/:id
Delete expense (requires authentication).

### GET /expenses/summary
Get expenses summary.
Query parameters:
- `date_from`: Start date
- `date_to`: End date

### GET /expenses/categories
Get expense categories with totals.

### GET /expenses/monthly
Get monthly expenses report.
Query parameters:
- `months`: Number of months (default: 12)

### PATCH /expenses/:id/approve
Approve expense (requires manager/admin role).

### PATCH /expenses/:id/reject
Reject expense (requires manager/admin role).

---

## Debts Endpoints

### GET /debts
Get all debts with optional filtering.
Query parameters:
- `status`: pending|partial|paid|overdue
- `customer_name`: Filter by customer
- `overdue`: true/false

### GET /debts/:id
Get debt by ID.

### POST /debts
Create new debt (requires authentication).
```json
{
  "customer_name": "string",
  "customer_phone": "string", // optional
  "amount": "number",
  "due_date": "YYYY-MM-DD", // optional
  "notes": "string" // optional
}
```

### PUT /debts/:id
Update debt (requires authentication).

### DELETE /debts/:id
Delete debt (requires authentication).

### GET /debts/summary
Get debts summary with totals.

### GET /debts/grouped
Get debts grouped by customer.

### GET /debts/overdue
Get overdue debts.

### GET /debts/:id/payments
Get payment history for a debt.

### POST /debts/:id/payments
Record debt payment (requires authentication).
```json
{
  "amount": "number",
  "payment_method": "cash|mpesa",
  "mpesa_code": "string", // required for mpesa
  "notes": "string" // optional
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics (cached for 5 minutes).

### GET /dashboard/charts
Get chart data for analytics (cached for 10 minutes).

### GET /dashboard/recent-activities
Get recent activities (sales and expenses).
Query parameters:
- `limit`: Number of activities (default: 10)

### GET /dashboard/alerts
Get system alerts (low stock, overdue debts, high expenses).

---

## User Management Endpoints (Admin Only)

### GET /users
Get all users (admin only).

### GET /users/:id
Get user by ID (admin only).

### POST /users
Create new user (admin only).
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin|manager|cashier"
}
```

### PUT /users/:id
Update user (admin only).

### PATCH /users/:id/password
Reset user password (admin only).
```json
{
  "password": "string"
}
```

### PATCH /users/:id/toggle-status
Toggle user active status (admin only).

### DELETE /users/:id
Delete user (admin only).

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (business logic errors)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

---

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Authentication endpoints may have stricter limits

---

## Environment Variables Required

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zion_grocery_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```
