@echo off
echo ========================================
echo PostgreSQL Startup Fix
echo ========================================
echo.

echo [1] Testing if PostgreSQL is already running...
netstat -an | findstr :5432 >nul
if not errorlevel 1 (
    echo ✅ PostgreSQL is already running on port 5432
    goto :postgres_running
)

echo [2] Attempting to start PostgreSQL service...
REM Try all common PostgreSQL service names
for %%s in (postgresql-x64-15 postgresql-x64-14 postgresql-x64-13 postgresql postgresql15 postgresql14 postgresql13) do (
    echo Trying service: %%s
    net start %%s >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL started successfully with service: %%s
        goto :postgres_running
    )
)

echo [3] Service startup failed, checking if PostgreSQL is installed...
if exist "C:\Program Files\PostgreSQL" (
    echo Found PostgreSQL installation
    for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
        echo Trying to start PostgreSQL from: %%d
        if exist "%%d\bin\pg_ctl.exe" (
            "%%d\bin\pg_ctl.exe" start -D "%%d\data" >nul 2>&1
            if not errorlevel 1 (
                echo ✅ PostgreSQL started manually from %%d
                goto :postgres_running
            )
        )
    )
)

echo [4] Manual startup options...
echo ❌ Automatic PostgreSQL startup failed
echo.
echo Please try one of these manual methods:
echo.
echo Method 1 - Services Manager:
echo   1. Press Windows + R
echo   2. Type: services.msc
echo   3. Find PostgreSQL service and start it
echo.
echo Method 2 - pgAdmin:
echo   1. Open pgAdmin
echo   2. Start the PostgreSQL server
echo.
echo Method 3 - Command line (run as Administrator):
echo   net start postgresql-x64-15
echo.
echo Press any key after starting PostgreSQL manually...
pause >nul

:postgres_running
echo.
echo [5] Testing database connection...
cd backend
node -e "
const db = require('./config/database');
db.raw('SELECT 1').then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
}).catch(err => {
    console.log('❌ Database connection failed:', err.message);
    console.log('Please check PostgreSQL is running and credentials are correct');
    process.exit(1);
});
"

if errorlevel 1 (
    echo.
    echo Database connection failed even though PostgreSQL appears to be running.
    echo Please check:
    echo - Database credentials in backend\.env
    echo - PostgreSQL is accepting connections on localhost:5432
    echo - Database 'zion_grocery_db' exists
    pause
    exit /b 1
)

echo.
echo ✅ PostgreSQL is running and database connection successful!
echo You can now run: start-integrated-server.bat
echo.
pause
