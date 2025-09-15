@echo off
echo ========================================
echo Zion Grocery Dashboard - Simple Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Creating database...
psql -U postgres -c "CREATE DATABASE zion_grocery_db;" 2>nul
echo Database created (or already exists)

echo [2/3] Installing dependencies...
cd backend
npm install

echo [3/3] Creating tables...
npx knex migrate:latest

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo Ready to start: run start.bat
echo.
pause
