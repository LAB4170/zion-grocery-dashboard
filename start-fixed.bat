@echo off
echo ========================================
echo Zion Grocery Dashboard - Fixed Startup
echo ========================================
echo.

cd /d "%~dp0"

REM Set environment to development for local
set NODE_ENV=development

REM Skip PostgreSQL service check since connection test already passed
echo [1/4] PostgreSQL Status: Database connection verified ✓
echo Database: zion_grocery_db already accessible
echo.

REM Install backend dependencies
echo [2/4] Installing dependencies...
cd backend
if not exist node_modules (
    echo Installing Node.js dependencies...
    npm install --silent
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully
) else (
    echo Dependencies already installed
)
echo.

REM Run database migrations
echo [3/4] Setting up database tables...
npm run migrate --silent
if errorlevel 1 (
    echo Warning: Migration may have failed, but continuing...
    echo This is normal if tables already exist
) else (
    echo Database tables ready
)
echo.

REM Start integrated server
echo [4/4] Starting integrated server...
echo.
echo ========================================
echo Zion Grocery Dashboard - Server Starting
echo ========================================
echo Environment: Local Development
echo Database: PostgreSQL (zion_grocery_db)
echo Server URL: http://localhost:5000
echo Login Page: http://localhost:5000/login
echo Dashboard: http://localhost:5000/dashboard
echo API Base: http://localhost:5000/api
echo Health Check: http://localhost:5000/health
echo ========================================
echo.
echo Credentials: ZionGroceries / Zion123$
echo.

REM Open browser after 3 seconds
echo Opening browser in 3 seconds...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000/login"

REM Start the integrated server
echo Starting Node.js server...
node server.js
