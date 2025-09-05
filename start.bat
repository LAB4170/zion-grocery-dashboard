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
net start | findstr /i postgresql >nul
if errorlevel 1 (
    echo PostgreSQL not running, attempting to start...
    net start postgresql-x64-15 >nul 2>&1
    if not errorlevel 1 (
        echo PostgreSQL started
        goto :postgres_started
    )
    net start postgresql-x64-14 >nul 2>&1
    if not errorlevel 1 (
        echo PostgreSQL started
        goto :postgres_started
    )
    net start postgresql >nul 2>&1
    if not errorlevel 1 (
        echo PostgreSQL started
        goto :postgres_started
    )
    echo Failed to start PostgreSQL automatically
    echo Please start PostgreSQL manually and press any key...
    pause >nul
) else (
    echo PostgreSQL already running
)

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
echo Database ready

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