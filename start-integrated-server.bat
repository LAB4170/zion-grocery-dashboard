@echo off
echo ========================================
echo Zion Grocery Dashboard - Integrated Server
echo ========================================
echo.

REM Check and start PostgreSQL service with multiple service name attempts
echo [1/5] Starting PostgreSQL service...
net start | findstr /i postgresql >nul
if errorlevel 1 (
    echo PostgreSQL not running, attempting to start...
    
    REM Try common PostgreSQL service names
    net start postgresql-x64-15 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL started (postgresql-x64-15)
        goto :postgres_started
    )
    
    net start postgresql-x64-14 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL started (postgresql-x64-14)
        goto :postgres_started
    )
    
    net start postgresql-x64-13 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL started (postgresql-x64-13)
        goto :postgres_started
    )
    
    net start postgresql >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL started (postgresql)
        goto :postgres_started
    )
    
    echo ❌ Failed to start PostgreSQL automatically
    echo Please start PostgreSQL manually from Services or pgAdmin
    echo Then press any key to continue...
    pause >nul
) else (
    echo ✅ PostgreSQL service already running
)

:postgres_started
echo.

REM Install backend dependencies
echo [2/5] Installing backend dependencies...
cd /d backend
if not exist node_modules (
    echo Installing Node.js packages...
    npm install --silent
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)
echo.

REM Run database migrations
echo [3/5] Setting up database...
npm run migrate --silent
if errorlevel 1 (
    echo ❌ Database migration failed
    echo Check PostgreSQL connection and try again
    pause
    exit /b 1
)
echo ✅ Database migrations completed
echo.

REM Test database connection
echo [4/5] Testing database connection...
node -e "
const db = require('./config/database');
db.raw('SELECT 1').then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
}).catch(err => {
    console.log('❌ Database connection failed:', err.message);
    process.exit(1);
});
"
if errorlevel 1 (
    echo Database connection test failed
    pause
    exit /b 1
)
echo.

REM Start integrated server
echo [5/5] Starting integrated server...
echo.
echo ========================================
echo Server Starting...
echo ========================================
echo Frontend: http://localhost:5000
echo Login:    http://localhost:5000/login.html
echo API:      http://localhost:5000/api
echo Health:   http://localhost:5000/health
echo ========================================
echo.

REM Wait 3 seconds then open browser
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000/login.html"

REM Start the integrated server
node server.js

echo.
echo Server stopped. Press any key to exit...
pause >nul
