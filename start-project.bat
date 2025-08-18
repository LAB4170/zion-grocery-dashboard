@echo off
echo Starting Zion Grocery Dashboard...

REM Check if PostgreSQL is running
net start | findstr postgresql >nul
if errorlevel 1 (
    echo Starting PostgreSQL service...
    net start postgresql-x64-15
)

REM Start backend in new window
echo Starting backend server...
start "Backend Server" cmd /k "cd /d backend && node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d frontend && python -m http.server 8080"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

REM Open browser to login page
echo Opening login page in browser...
start http://localhost:8080/login.html

echo.
echo ========================================
echo Zion Grocery Dashboard is now running!
echo ========================================
echo Login Page: http://localhost:8080/login.html
echo Dashboard:  http://localhost:8080 (after login)
echo Backend:    http://localhost:5000
echo.
echo Login credentials:
echo Primary - Username: ZionGroceries  Password: Zion123$
echo Admin   - Username: admin         Password: admin123
echo Manager - Username: manager       Password: manager123
echo.
echo Press any key to close this window...
pause >nul
