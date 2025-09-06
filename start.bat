@echo off
echo ========================================
echo Zion Grocery Dashboard - Integrated Server
echo ========================================
echo.

cd /d "%~dp0"

REM Set environment to development for local
set NODE_ENV=development

REM Check and start PostgreSQL service
echo [1/4] Starting PostgreSQL service...

REM First check if PostgreSQL is already running by testing connection
echo Testing PostgreSQL connection...
set PGPASSWORD=ZionGrocery2024!
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5432 -U postgres >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL already running and accessible
    goto :postgres_started
)

REM If not accessible, try to start the service
echo PostgreSQL not accessible, attempting to start service...
net start postgresql-x64-17 >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL 17 service started
    timeout /t 3 /nobreak >nul
    goto :postgres_started
)

net start postgresql-17 >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL 17 service started (alternative name)
    timeout /t 3 /nobreak >nul
    goto :postgres_started
)

net start postgresql-x64-15 >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL 15 service started
    timeout /t 3 /nobreak >nul
    goto :postgres_started
)

net start postgresql-x64-14 >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL 14 service started
    timeout /t 3 /nobreak >nul
    goto :postgres_started
)

net start postgresql >nul 2>&1
if not errorlevel 1 (
    echo PostgreSQL service started
    timeout /t 3 /nobreak >nul
    goto :postgres_started
)

echo Failed to start PostgreSQL service automatically
echo.
echo Troubleshooting steps:
echo 1. Check if PostgreSQL is installed
echo 2. Try starting PostgreSQL manually from Services
echo 3. Verify PostgreSQL service name in Windows Services
echo.
echo Press any key to continue anyway (database connection will be tested)...
pause >nul

:postgres_started
echo.

REM Install backend dependencies
echo [2/4] Installing dependencies...
cd backend
if not exist node_modules (
    npm install --silent
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)
echo Dependencies ready

REM Run database migrations
echo [3/4] Setting up database...
npm run migrate --silent >nul 2>&1
if errorlevel 1 (
    echo Warning: Database migration failed - continuing anyway
) else (
    echo Database ready
)

REM Start integrated server
echo [4/4] Starting integrated server...
echo.
echo ========================================
echo Zion Grocery Dashboard - Integrated Server
echo ========================================
echo Environment: Local Development
echo Database: Local PostgreSQL
echo Frontend + Backend: http://localhost:5000
echo Login: http://localhost:5000/login
echo API: http://localhost:5000/api
echo Health: http://localhost:5000/health
echo ========================================
echo.

REM Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000/login"

REM Start the integrated server
node server.js