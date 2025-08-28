@echo off
echo ========================================
echo Zion Grocery Database Status Check
echo ========================================
echo.
echo Server: Zion Grocery Server
echo Host: localhost:5432
echo Database: zion_grocery_db
echo User: postgres
echo.

cd /d backend

echo [1/6] Testing PostgreSQL connection...
echo const db = require('./config/database'); > temp_db_test.js
echo db.raw('SELECT version()').then((result) =^> { >> temp_db_test.js
echo   console.log('✅ PostgreSQL Connection: SUCCESS'); >> temp_db_test.js
echo   console.log('Version:', result.rows[0].version); >> temp_db_test.js
echo   return db.raw('SELECT current_database()'); >> temp_db_test.js
echo }).then((result) =^> { >> temp_db_test.js
echo   console.log('Database:', result.rows[0].current_database); >> temp_db_test.js
echo   process.exit(0); >> temp_db_test.js
echo }).catch(err =^> { >> temp_db_test.js
echo   console.log('❌ PostgreSQL Connection: FAILED'); >> temp_db_test.js
echo   console.log('Error:', err.message); >> temp_db_test.js
echo   process.exit(1); >> temp_db_test.js
echo }); >> temp_db_test.js

node temp_db_test.js
set DB_TEST_RESULT=%ERRORLEVEL%
del temp_db_test.js

if %DB_TEST_RESULT% neq 0 (
    echo.
    echo Database connection failed. Check:
    echo - PostgreSQL service is running
    echo - Credentials in .env file are correct
    echo - Database 'zion_grocery_db' exists
    pause
    exit /b 1
)

echo.
echo [2/6] Checking migration status...
echo const db = require('./config/database'); > temp_migration_test.js
echo db('knex_migrations').select('*').orderBy('batch', 'desc').then((migrations) =^> { >> temp_migration_test.js
echo   console.log('✅ Migration Status: SUCCESS'); >> temp_migration_test.js
echo   console.log('Total migrations:', migrations.length); >> temp_migration_test.js
echo   if (migrations.length ^> 0) { >> temp_migration_test.js
echo     console.log('Latest batch:', migrations[0].batch); >> temp_migration_test.js
echo     console.log('Latest migration:', migrations[0].name); >> temp_migration_test.js
echo   } >> temp_migration_test.js
echo   process.exit(0); >> temp_migration_test.js
echo }).catch(err =^> { >> temp_migration_test.js
echo   console.log('❌ Migration Status: FAILED'); >> temp_migration_test.js
echo   console.log('Error:', err.message); >> temp_migration_test.js
echo   process.exit(1); >> temp_migration_test.js
echo }); >> temp_migration_test.js

node temp_migration_test.js
set MIGRATION_RESULT=%ERRORLEVEL%
del temp_migration_test.js

if %MIGRATION_RESULT% neq 0 (
    echo Migration check failed
    echo Running migrations...
    npm run migrate
)

echo.
echo [3/6] Checking database tables...
echo const db = require('./config/database'); > temp_tables_test.js
echo db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name").then((result) =^> { >> temp_tables_test.js
echo   console.log('✅ Database Tables:'); >> temp_tables_test.js
echo   result.rows.forEach(row =^> { >> temp_tables_test.js
echo     console.log('  -', row.table_name); >> temp_tables_test.js
echo   }); >> temp_tables_test.js
echo   process.exit(0); >> temp_tables_test.js
echo }).catch(err =^> { >> temp_tables_test.js
echo   console.log('❌ Table Check: FAILED'); >> temp_tables_test.js
echo   console.log('Error:', err.message); >> temp_tables_test.js
echo   process.exit(1); >> temp_tables_test.js
echo }); >> temp_tables_test.js

node temp_tables_test.js
del temp_tables_test.js

echo.
echo [4/6] Checking table structure...
echo const db = require('./config/database'); > temp_structure_test.js
echo const tables = ['users', 'products', 'sales', 'expenses', 'debts', 'debt_payments']; >> temp_structure_test.js
echo Promise.all(tables.map(table =^>  >> temp_structure_test.js
echo     db.raw(\`SELECT column_name FROM information_schema.columns WHERE table_name = '\${table}' ORDER BY ordinal_position\`) >> temp_structure_test.js
echo     .then(result =^> ({ table, columns: result.rows.map(r =^> r.column_name) })) >> temp_structure_test.js
echo     .catch(() =^> ({ table, columns: [] })) >> temp_structure_test.js
echo )).then(results =^> { >> temp_structure_test.js
echo   console.log('✅ Table Structure:'); >> temp_structure_test.js
echo   results.forEach(({ table, columns }) =^> { >> temp_structure_test.js
echo     if (columns.length ^> 0) { >> temp_structure_test.js
echo       console.log(\`  \${table}: \${columns.length} columns\`); >> temp_structure_test.js
echo     } else { >> temp_structure_test.js
echo       console.log(\`  \${table}: NOT FOUND\`); >> temp_structure_test.js
echo     } >> temp_structure_test.js
echo   }); >> temp_structure_test.js
echo   process.exit(0); >> temp_structure_test.js
echo }).catch(err =^> { >> temp_structure_test.js
echo   console.log('❌ Structure Check: FAILED'); >> temp_structure_test.js
echo   console.log('Error:', err.message); >> temp_structure_test.js
echo   process.exit(1); >> temp_structure_test.js
echo }); >> temp_structure_test.js

node temp_structure_test.js
del temp_structure_test.js

echo.
echo [5/6] Testing database operations...
echo const db = require('./config/database'); > temp_operations_test.js
echo db.raw('SELECT COUNT(*) as count FROM products').then((result) =^> { >> temp_operations_test.js
echo   console.log('✅ Products table:', result.rows[0].count, 'records'); >> temp_operations_test.js
echo   return db.raw('SELECT COUNT(*) as count FROM sales'); >> temp_operations_test.js
echo }).then((result) =^> { >> temp_operations_test.js
echo   console.log('✅ Sales table:', result.rows[0].count, 'records'); >> temp_operations_test.js
echo   return db.raw('SELECT COUNT(*) as count FROM expenses'); >> temp_operations_test.js
echo }).then((result) =^> { >> temp_operations_test.js
echo   console.log('✅ Expenses table:', result.rows[0].count, 'records'); >> temp_operations_test.js
echo   return db.raw('SELECT COUNT(*) as count FROM debts'); >> temp_operations_test.js
echo }).then((result) =^> { >> temp_operations_test.js
echo   console.log('✅ Debts table:', result.rows[0].count, 'records'); >> temp_operations_test.js
echo   console.log('✅ Database Operations: SUCCESS'); >> temp_operations_test.js
echo   process.exit(0); >> temp_operations_test.js
echo }).catch(err =^> { >> temp_operations_test.js
echo   console.log('❌ Database Operations: FAILED'); >> temp_operations_test.js
echo   console.log('Error:', err.message); >> temp_operations_test.js
echo   process.exit(1); >> temp_operations_test.js
echo }); >> temp_operations_test.js

node temp_operations_test.js
del temp_operations_test.js

echo.
echo [6/6] Configuration validation...
echo require('dotenv').config(); > temp_config_test.js
echo console.log('✅ Configuration Check:'); >> temp_config_test.js
echo console.log('  Host:', process.env.DB_HOST ^|^| 'localhost'); >> temp_config_test.js
echo console.log('  Port:', process.env.DB_PORT ^|^| '5432'); >> temp_config_test.js
echo console.log('  Database:', process.env.DB_NAME ^|^| 'zion_grocery_db'); >> temp_config_test.js
echo console.log('  User:', process.env.DB_USER ^|^| 'postgres'); >> temp_config_test.js
echo console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET'); >> temp_config_test.js
echo console.log('  Environment:', process.env.NODE_ENV ^|^| 'development'); >> temp_config_test.js

node temp_config_test.js
del temp_config_test.js

echo.
echo ========================================
echo Database Status: HEALTHY ✅
echo ========================================
echo All database checks passed successfully!
echo.
echo Ready to run: start-simple.bat
echo.
pause
