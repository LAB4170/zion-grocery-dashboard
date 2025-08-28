@echo off
echo ========================================
echo Zion Grocery Dashboard - Unified Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
cd backend
npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo [2/4] Testing database connection...
node -e "require('./config/database').raw('SELECT 1').then(()=>console.log('✅ Database connected')).catch(e=>{console.log('❌ Database failed:',e.message);process.exit(1)})"
if errorlevel 1 (
    echo.
    echo Database connection failed. Check PostgreSQL service.
    echo Run: net start postgresql-x64-15
    pause
    exit /b 1
)

echo [3/4] Running migrations...
npm run migrate --silent

echo [4/4] Starting server...
echo.
echo 🚀 Starting Zion Grocery Dashboard...
echo 📊 Frontend: http://localhost:5000
echo 🔧 Backend API: http://localhost:5000/api
echo 🏥 Health: http://localhost:5000/health
echo.

start http://localhost:5000
npm start
