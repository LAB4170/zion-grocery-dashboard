@echo off
echo Setting up Zion Grocery Database...

echo.
echo Step 1: Creating PostgreSQL database
psql -U postgres -c "CREATE DATABASE zion_grocery_db;"

echo.
echo Step 2: Installing dependencies
cd backend
npm install

echo.
echo Step 3: Running database migrations
npx knex migrate:latest

echo.
echo Step 4: Seeding initial data
npx knex seed:run

echo.
echo Step 5: Starting production server
node server.js

pause
