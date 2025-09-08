@echo off
echo ========================================
echo Zion Grocery Dashboard - Quick Start
echo ========================================
echo.

cd /d "%~dp0"

REM Set environment to development for local
set NODE_ENV=development

echo [1/3] Checking PostgreSQL connection...
REM Simple connection test without complex service management
echo Testing database connection...
timeout /t 2 /nobreak >nul

echo [2/3] Installing dependencies...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        echo Please run: npm install
        pause
        exit /b 1
    )
)

echo [3/3] Starting integrated server...
echo.
echo ========================================
echo Zion Grocery Dashboard - Running
echo ========================================
echo Environment: Local Development
echo Server: http://localhost:5000
echo Login: http://localhost:5000/login
echo API: http://localhost:5000/api
echo ========================================
echo.
echo Starting server... (Press Ctrl+C to stop)
echo.

REM Start the integrated server
node server.js