@echo off
echo ========================================
echo Zion Grocery Dashboard - Simple Start
echo ========================================
echo.

echo [1/3] Testing database connection...
cd /d backend
node -e "
const db = require('./config/database');
db.raw('SELECT 1').then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
}).catch(err => {
    console.log('❌ Database connection failed:', err.message);
    console.log('Please ensure PostgreSQL is running');
    process.exit(1);
});
"

if errorlevel 1 (
    echo.
    echo Database connection failed. Please start PostgreSQL manually:
    echo 1. Open Services (services.msc)
    echo 2. Find PostgreSQL service and start it
    echo 3. Or use pgAdmin to start the server
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
if not exist node_modules (
    npm install --silent
)

echo [3/3] Starting integrated server...
echo.
echo ========================================
echo Server Starting...
echo ========================================
echo Frontend: http://localhost:5000
echo Login:    http://localhost:5000/login.html
echo API:      http://localhost:5000/api
echo ========================================
echo.

REM Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000/login.html"

REM Start the server
node server.js
