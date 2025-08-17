# PostgreSQL Setup Guide for Zion Grocery Dashboard

## Method 1: Using pgAdmin (Recommended for beginners)

### Step 1: Open pgAdmin
1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server using the password you set during installation

### Step 2: Create Database
1. Right-click on **Databases**
2. Select **Create** → **Database**
3. Name: `zion_grocery_db`
4. Click **Save**

### Step 3: Run Project Setup
1. Open Command Prompt in your project folder
2. Run: `cd backend && npm install`
3. Run: `npx knex migrate:latest`
4. Run: `npx knex seed:run`
5. Run: `node server.js`

## Method 2: Using Command Line

### Step 1: Find PostgreSQL Installation
Check these common paths:
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`

### Step 2: Create Database
Open Command Prompt as Administrator:
```bash
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE zion_grocery_db;"
```

### Step 3: Setup Project
```bash
cd backend
npm install
npx knex migrate:latest
npx knex seed:run
node server.js
```

## Method 3: Automated Script

Double-click `setup-postgres.bat` in your project folder.

## Troubleshooting

### If you get "psql not recognized":
- Use pgAdmin instead (Method 1)
- Or find the exact path to psql.exe and use full path

### If database connection fails:
- Check password in `.env` file matches your PostgreSQL password
- Ensure PostgreSQL service is running (Windows Services)

### If migrations fail:
- Make sure database `zion_grocery_db` exists
- Check PostgreSQL is running on port 5432

## Success Indicators
- ✅ Database `zion_grocery_db` created
- ✅ Tables created (users, products, sales, expenses, debts)
- ✅ Server starts with "🚀 Zion Grocery API running on port 5000"
- ✅ No connection errors in console
