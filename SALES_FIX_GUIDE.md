# Sales Creation Fix Guide - HTTP 500 Error Resolution

## Problem Summary
The sales creation was failing with HTTP 500 Internal Server Error due to schema mismatches between the database tables and backend models.

## Root Causes Identified & Fixed

### 1. ✅ Backend Sale Model Schema Mismatch
**Issue**: Missing `mpesa_code` and `notes` fields, incorrect field names
**Fix**: Updated `backend/models/Sale.js` to include all PostgreSQL schema fields

### 2. ✅ Frontend Data Format Issues  
**Issue**: Sending `user_id` instead of `created_by`, missing M-Pesa code and notes
**Fix**: Updated `frontend/scripts/sales.js` to send correct field names

### 3. ✅ Missing UI Fields
**Issue**: Sales modal missing M-Pesa code and notes input fields
**Fix**: Added fields to `frontend/modals/sales-modal.html` and updated `frontend/scripts/modals.js`

### 4. ✅ Debt Creation Schema Mismatch
**Issue**: Debt creation using old schema field names
**Fix**: Updated debt creation to use `amount_paid`, `balance`, `notes` fields

## Setup Instructions

### Step 1: Database Setup
Run these commands in the backend directory:

```bash
# Navigate to backend directory
cd backend

# Verify database connection
node verify-database.js

# If tables are missing, create them
node setup-database-schema.js
```

### Step 2: Start the Server
```bash
# From project root
npm start

# Or from backend directory
cd backend
npm start
```

### Step 3: Test Sales Creation

#### Test Case 1: Cash Sale
1. Open http://localhost:5000
2. Login with: ZionGroceries / Zion123$
3. Go to Sales section
4. Click "Add Sale"
5. Select a product, quantity, date
6. Payment Method: Cash
7. Add notes (optional)
8. Submit

#### Test Case 2: M-Pesa Sale
1. Follow steps 1-5 above
2. Payment Method: M-Pesa
3. Enter customer name and phone (required)
4. Enter M-Pesa transaction code (required)
5. Add notes (optional)
6. Submit

#### Test Case 3: Debt Sale
1. Follow steps 1-5 above
2. Payment Method: Debt
3. Enter customer name and phone (required)
4. Add notes (optional)
5. Submit
6. Verify debt record is created

## Database Schema Reference

### Sales Table Fields (All Required by Backend)
```sql
- id: UUID (auto-generated)
- product_id: UUID (required)
- product_name: VARCHAR(100) (required)
- quantity: INTEGER (required)
- unit_price: DECIMAL(10,2) (required)
- total: DECIMAL(10,2) (required)
- payment_method: VARCHAR(20) (cash/mpesa/debt)
- customer_name: VARCHAR(100) (for mpesa/debt)
- customer_phone: VARCHAR(20) (for mpesa/debt)
- status: VARCHAR(20) (completed/pending/cancelled)
- mpesa_code: VARCHAR(50) (for mpesa payments)
- notes: TEXT (optional)
- created_by: UUID (system user)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Troubleshooting

### If Sales Creation Still Fails:

1. **Check Database Connection**
   ```bash
   cd backend
   node verify-database.js
   ```

2. **Check Server Logs**
   Look for specific error messages in the console

3. **Verify Table Schema**
   ```sql
   \d sales  -- In PostgreSQL console
   ```

4. **Check Frontend Console**
   Open browser DevTools → Console for JavaScript errors

5. **Test API Directly**
   ```bash
   curl -X POST http://localhost:5000/api/sales \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "test-uuid",
       "product_name": "Test Product",
       "quantity": 1,
       "unit_price": 10.00,
       "total": 10.00,
       "payment_method": "cash",
       "created_by": "system"
     }'
   ```

## Files Modified

### Backend Files:
- `backend/models/Sale.js` - Added mpesa_code, notes, fixed field names
- `backend/verify-database.js` - Database verification script
- `backend/setup-database-schema.js` - Schema setup script

### Frontend Files:
- `frontend/scripts/sales.js` - Fixed data format and field names
- `frontend/modals/sales-modal.html` - Added M-Pesa code and notes fields
- `frontend/scripts/modals.js` - Updated field visibility logic

## Expected Results

After applying all fixes:
- ✅ Sales creation works for all payment methods (cash, M-Pesa, debt)
- ✅ M-Pesa transactions require customer info and transaction code
- ✅ Debt sales create corresponding debt records
- ✅ Product stock is properly updated
- ✅ All data persists to PostgreSQL database
- ✅ No more HTTP 500 errors

## Database Performance

The system now includes:
- UUID primary keys for all tables
- Proper foreign key relationships
- Performance indexes on frequently queried columns
- Transaction support for data integrity
- Comprehensive error handling

## Next Steps

1. Test all payment methods thoroughly
2. Verify debt management functionality
3. Check product stock updates
4. Test data persistence across browser sessions
5. Verify multi-user synchronization (if applicable)
