@echo off
echo ========================================
echo  Zion Grocery Dashboard - System Startup
echo ========================================

echo.
echo [1/4] Checking PostgreSQL service...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL service...
    net start postgresql-x64-14
    if %errorlevel% neq 0 (
        echo ERROR: Failed to start PostgreSQL service
        echo Please ensure PostgreSQL is installed and configured
        pause
        exit /b 1
    )
) else (
    echo PostgreSQL service is running
)

echo.
echo [2/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Running database migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo.
echo [4/4] Starting integrated server...
echo.
echo ========================================
echo  Server Information:
echo  - Backend API: http://localhost:5000/api
echo  - Frontend UI: http://localhost:5000
echo  - Health Check: http://localhost:5000/health
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
