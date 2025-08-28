@echo off
echo ========================================
echo Zion Grocery Database Quick Test
echo ========================================
echo.
echo Server: Zion Grocery Server
echo Host: localhost:5432
echo Database: zion_grocery_db
echo User: postgres
echo.

cd /d backend

echo [1/3] Testing database connection...
node -e "const db=require('./config/database');db.raw('SELECT version()').then(r=>console.log('✅ Connected:',r.rows[0].version.split(' ')[0]+' '+r.rows[0].version.split(' ')[1])).catch(e=>console.log('❌ Failed:',e.message)).finally(()=>process.exit())"

echo.
echo [2/3] Checking migrations...
node -e "const db=require('./config/database');db('knex_migrations').count('*').then(r=>console.log('✅ Migrations:',r[0].count,'applied')).catch(e=>{console.log('❌ No migrations, running...');require('child_process').execSync('npm run migrate',{stdio:'inherit'})}).finally(()=>process.exit())"

echo.
echo [3/3] Testing tables...
node -e "const db=require('./config/database');Promise.all(['products','sales','expenses','debts'].map(t=>db(t).count('*').then(r=>console.log('✅',t+':',r[0].count,'records')).catch(()=>console.log('❌',t+': missing')))).finally(()=>process.exit())"

echo.
echo ========================================
echo Database test completed!
echo ========================================
echo.
echo If all tests show ✅, your database is working.
echo You can now run: start-simple.bat
echo.
pause
