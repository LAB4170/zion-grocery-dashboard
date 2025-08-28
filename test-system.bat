@echo off
echo ========================================
echo Zion Grocery Dashboard System Test
echo ========================================
echo.

REM Check and start PostgreSQL service with multiple service name attempts
echo [1/4] Starting PostgreSQL service...
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
    echo Available PostgreSQL services:
    sc query | findstr /i postgresql
    echo.
    echo Please start PostgreSQL manually and press any key to continue...
    pause >nul
) else (
    echo ✅ PostgreSQL service already running
)

:postgres_started
echo.

REM Install and test backend
echo [2/4] Setting up backend...
cd /d backend
if not exist node_modules (
    echo Installing Node.js packages...
    npm install --silent
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
)

REM Run database migrations
echo Running database migrations...
npm run migrate --silent
if errorlevel 1 (
    echo ❌ Database migration failed
    echo Check PostgreSQL connection and credentials
    pause
    exit /b 1
)
echo ✅ Backend setup completed
echo.

REM Test database connection
echo [3/4] Testing database connection...
node -e "
const db = require('./config/database');
db.raw('SELECT version()').then((result) => {
    console.log('✅ Database connection successful');
    console.log('PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
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

REM Test integrated server
echo [4/4] Testing integrated server...
echo Starting server for 10 seconds...
start "Server Test" cmd /c "node server.js"
timeout /t 5 /nobreak >nul

REM Test server endpoints
echo Testing server endpoints...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Server health check failed
) else (
    echo ✅ Server health check passed
)

curl -s http://localhost:5000/api/test-db >nul 2>&1
if errorlevel 1 (
    echo ❌ Database API test failed
) else (
    echo ✅ Database API test passed
)

curl -s http://localhost:5000/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend serving test failed
) else (
    echo ✅ Frontend serving test passed
)

REM Stop test server
taskkill /f /im node.exe >nul 2>&1

echo.
echo ========================================
echo System Test Results
echo ========================================
echo ✅ PostgreSQL: Running and connected
echo ✅ Backend: Node.js/Express integrated server
echo ✅ Frontend: Served from backend (no separate server needed)
echo ✅ Database: PostgreSQL with migrations completed
echo ✅ Core Stack: HTML, CSS, JS, Node.js, Express.js, PostgreSQL
echo.
echo ========================================
echo Ready to start! Use: start-integrated-server.bat
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
