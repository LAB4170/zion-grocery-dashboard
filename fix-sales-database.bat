@echo off
echo ========================================
echo  Zion Grocery Dashboard - Sales Fix
echo ========================================
echo.

echo Checking PostgreSQL service...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL service not found. Trying alternative service names...
    sc query postgresql >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ PostgreSQL service not running. Please start PostgreSQL manually.
        echo    Common service names: postgresql-x64-14, postgresql, PostgreSQL
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL service is running

echo.
echo Navigating to backend directory...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo ❌ Backend directory not found or invalid
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Step 1: Verifying Database Connection
echo ========================================
node verify-database.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database verification failed!
    echo.
    echo Troubleshooting steps:
    echo 1. Ensure PostgreSQL is running
    echo 2. Check database credentials in .env file
    echo 3. Create database: createdb zion_grocery_db
    echo 4. Verify connection string in .env
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Step 2: Setting Up Database Schema
echo ========================================
node setup-database-schema.js
if %errorlevel% neq 0 (
    echo ❌ Database schema setup failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Step 3: Starting Server
echo ========================================
echo Server will start on http://localhost:5000
echo Login credentials: ZionGroceries / Zion123$
echo.
echo Press Ctrl+C to stop the server
echo.

start "" "http://localhost:5000"
node server.js

pause
