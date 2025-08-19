@echo off
echo ========================================
echo   Zion Grocery Dashboard - Backend Deployment
echo ========================================
echo.

echo 1. Make sure you have:
echo    - Railway account (railway.app)
echo    - GitHub repository with your code
echo    - Netlify frontend URL ready
echo.

echo 2. Database Setup:
echo    - Go to railway.app
echo    - Create new project
echo    - Add PostgreSQL service
echo    - Copy DATABASE_URL
echo.

echo 3. Backend Deployment:
echo    - Deploy from GitHub repo on Railway
echo    - Add environment variables
echo    - Get backend URL
echo.

echo 4. Update frontend config with backend URL
echo.

echo Press any key to open deployment guide...
pause > nul
start DEPLOYMENT_GUIDE.md

echo.
echo Opening Railway in browser...
start https://railway.app

echo.
echo Deployment guide opened!
echo Follow the step-by-step instructions.
pause
