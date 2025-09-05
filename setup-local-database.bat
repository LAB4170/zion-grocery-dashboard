@echo off
echo ========================================
echo   Zion Grocery Dashboard - Local Database Setup
echo ========================================
echo.

:: Check if PostgreSQL is installed
echo [1/6] Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL not found. Please install PostgreSQL first:
    echo    Download from: https://www.postgresql.org/download/windows/
    echo    Or use: winget install PostgreSQL.PostgreSQL
    pause
    exit /b 1
)
echo ✅ PostgreSQL found

:: Check if PostgreSQL service is running
echo [2/6] Checking PostgreSQL service...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo ⚠️  Starting PostgreSQL service...
    net start postgresql-x64-14
    if %errorlevel% neq 0 (
        echo ❌ Failed to start PostgreSQL service
        echo    Try manually: Services → PostgreSQL → Start
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL service running

:: Create database
echo [3/6] Creating local database...
createdb -U postgres zion_grocery_db 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database 'zion_grocery_db' created
) else (
    echo ⚠️  Database might already exist, continuing...
)

:: Navigate to backend directory
echo [4/6] Navigating to backend directory...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo ❌ Backend directory not found or invalid
    pause
    exit /b 1
)

:: Install dependencies
echo [5/6] Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

:: Run migrations
echo [6/6] Running database migrations...
set NODE_ENV=development
npx knex migrate:latest
if %errorlevel% neq 0 (
    echo ❌ Migration failed. Check database connection.
    echo    Verify PostgreSQL password: ZionGrocery2024!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Local Database Setup Complete!
echo ========================================
echo.
echo Database Details:
echo   Host: localhost:5432
echo   Database: zion_grocery_db
echo   User: postgres
echo   Password: ZionGrocery2024!
echo.
echo Next Steps:
echo   1. Run: npm start (from backend directory)
echo   2. Access: http://localhost:5000
echo   3. Login: ZionGroceries / Zion123$
echo.
pause
