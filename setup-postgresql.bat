@echo off
echo Starting PostgreSQL Setup for Zion Grocery Dashboard...
echo.

REM Check if PostgreSQL is installed
if exist "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" (
    echo PostgreSQL 17 found!
) else (
    echo PostgreSQL not found. Please install PostgreSQL first.
    pause
    exit /b 1
)

REM Start PostgreSQL service
echo Starting PostgreSQL service...
net start postgresql-x64-17
if %errorlevel% neq 0 (
    echo Failed to start PostgreSQL service
    echo Trying alternative service name...
    net start postgresql-17
)

REM Wait a moment for service to start
timeout /t 3 /nobreak >nul

REM Set environment variables
set PGPASSWORD=ZionGrocery2024!
set PGUSER=postgres
set PGHOST=localhost
set PGPORT=5432

REM Create database
echo.
echo Creating zion_grocery_db database...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE zion_grocery_db;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist, checking...
    "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname = 'zion_grocery_db';"
)

REM Test connection
echo.
echo Testing database connection...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d zion_grocery_db -c "SELECT 'Connection successful!' as status;"

if %errorlevel% equ 0 (
    echo.
    echo ✅ PostgreSQL setup complete!
    echo Database: zion_grocery_db
    echo Host: localhost:5432
    echo User: postgres
    echo.
    echo You can now run the backend server.
) else (
    echo.
    echo ❌ Database connection failed
    echo Please check PostgreSQL installation and credentials
)

echo.
pause
