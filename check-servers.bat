@echo off
echo ========================================
echo Zion Grocery Server Status Check
echo ========================================
echo.

echo [1/5] Checking if servers are running...
echo.

echo Checking Backend Server (Port 5000)...
curl -s -o nul -w "Backend Status: %%{http_code}\n" http://localhost:5000/health || echo Backend: Not responding

echo.
echo Checking Frontend Access (Port 5000)...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:5000/ || echo Frontend: Not responding

echo.
echo [2/5] Testing API endpoints...
echo.

echo Testing Database Connection...
curl -s http://localhost:5000/api/test-db || echo API test-db: Failed

echo.
echo Testing Products API...
curl -s -o nul -w "Products API: %%{http_code}\n" http://localhost:5000/api/products || echo Products API: Failed

echo.
echo Testing Sales API...
curl -s -o nul -w "Sales API: %%{http_code}\n" http://localhost:5000/api/sales || echo Sales API: Failed

echo.
echo [3/5] Checking processes...
echo.

echo Looking for Node.js processes...
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" && echo ✅ Node.js processes found || echo ❌ No Node.js processes running

echo.
echo [4/5] Testing frontend files...
echo.

if exist "frontend\index.html" (
    echo ✅ Frontend index.html exists
) else (
    echo ❌ Frontend index.html missing
)

if exist "frontend\scripts\config.js" (
    echo ✅ Frontend config.js exists
) else (
    echo ❌ Frontend config.js missing
)

echo.
echo [5/5] Configuration check...
echo.

cd /d backend
node -e "console.log('Backend Port:', process.env.PORT || 5000)"
node -e "console.log('Database:', process.env.DB_NAME || 'zion_grocery_db')"

echo.
echo ========================================
echo Server Analysis Complete
echo ========================================
echo.
echo Expected URLs:
echo Frontend: http://localhost:5000
echo Backend API: http://localhost:5000/api
echo Health Check: http://localhost:5000/health
echo.
echo If servers are not running, use:
echo - start-simple.bat (to start both servers)
echo - start-integrated-server.bat (comprehensive startup)
echo.
pause
