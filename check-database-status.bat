@echo off
echo ========================================
echo Zion Grocery Dashboard - Database Status Check
echo ========================================

echo.
echo 1. Checking PostgreSQL Service Status...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL service found
    sc query postgresql-x64-14 | findstr "STATE" | findstr "RUNNING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL service is RUNNING
    ) else (
        echo ❌ PostgreSQL service is NOT RUNNING
        echo.
        echo Starting PostgreSQL service...
        net start postgresql-x64-14
        if %errorlevel% equ 0 (
            echo ✅ PostgreSQL service started successfully
        ) else (
            echo ❌ Failed to start PostgreSQL service
            echo Please start it manually from Services or run as Administrator
        )
    )
) else (
    echo ❌ PostgreSQL service not found
    echo Please install PostgreSQL or check service name
)

echo.
echo 2. Testing Database Connection...
cd backend
node -e "
const db = require('./config/database');
async function test() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if database exists
    const result = await db.raw('SELECT current_database()');
    console.log('✅ Connected to database:', result.rows[0].current_database);
    
    // Check tables
    const tables = await db.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = ?', ['public']);
    console.log('📊 Tables found:', tables.rows.length);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found - run migrations');
    } else {
      console.log('✅ Tables:', tables.rows.map(t => t.table_name).join(', '));
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    
    if (error.message.includes('database \"zion_grocery_db\" does not exist')) {
      console.log('💡 Solution: Create database with: createdb zion_grocery_db');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('💡 Solution: Start PostgreSQL service');
    } else if (error.message.includes('password authentication failed')) {
      console.log('💡 Solution: Check password in .env file');
    }
  }
  process.exit(0);
}
test();
"

echo.
echo 3. Next Steps:
echo    - If database doesn't exist: createdb zion_grocery_db
echo    - If no tables found: cd backend && npm run migrate
echo    - Then restart server: npm start
echo.
pause
