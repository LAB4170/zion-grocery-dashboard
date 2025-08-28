@echo off
echo ========================================
echo PostgreSQL Service Diagnostic
echo ========================================
echo.

echo [1] Checking all PostgreSQL services...
sc query | findstr /i postgresql
echo.

echo [2] Checking running services with 'postgres' in name...
net start | findstr /i postgres
echo.

echo [3] Checking if PostgreSQL is listening on port 5432...
netstat -an | findstr :5432
echo.

echo [4] Testing direct database connection...
cd backend
node -e "
const db = require('./config/database');
db.raw('SELECT version()').then((result) => {
    console.log('✅ Database connection successful');
    console.log('PostgreSQL Version:', result.rows[0].version);
    process.exit(0);
}).catch(err => {
    console.log('❌ Database connection failed:', err.message);
    process.exit(1);
});
"
echo.

echo [5] Checking PostgreSQL installation paths...
if exist "C:\Program Files\PostgreSQL" (
    echo ✅ Found PostgreSQL in Program Files
    dir "C:\Program Files\PostgreSQL" /b
) else (
    echo ❌ PostgreSQL not found in standard Program Files location
)
echo.

if exist "C:\Program Files (x86)\PostgreSQL" (
    echo ✅ Found PostgreSQL in Program Files (x86)
    dir "C:\Program Files (x86)\PostgreSQL" /b
) else (
    echo ❌ PostgreSQL not found in Program Files (x86)
)
echo.

echo [6] All Windows services containing 'sql'...
sc query | findstr /i sql
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
pause
