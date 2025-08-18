@echo off
echo Setting up PostgreSQL for Zion Grocery Dashboard...

REM Set PostgreSQL path (adjust version if needed)
set PGPATH="C:\Program Files\PostgreSQL\15\bin"
set PGPATH2="C:\Program Files\PostgreSQL\16\bin"

echo.
echo Step 1: Creating database...
if exist %PGPATH%\psql.exe (
    %PGPATH%\psql.exe -U postgres -c "CREATE DATABASE zion_grocery_db;"
) else if exist %PGPATH2%\psql.exe (
    %PGPATH2%\psql.exe -U postgres -c "CREATE DATABASE zion_grocery_db;"
) else (
    echo PostgreSQL not found in standard locations.
    echo Please check your PostgreSQL installation path.
    pause
    exit /b 1
)

echo.
echo Step 2: Installing Node.js dependencies...
cd backend
npm install

echo.
echo Step 3: Running database migrations...
npx knex migrate:latest

echo.
echo Step 4: Seeding initial data...
npx knex seed:run

echo.
echo Step 5: Starting production server...
node server.js

pause
