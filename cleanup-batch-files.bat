@echo off
echo ========================================
echo Cleaning up duplicate batch files...
echo ========================================
echo.

cd /d "%~dp0"

echo Removing duplicate startup files...
if exist "start-simple.bat" del "start-simple.bat"
if exist "start-project.bat" del "start-project.bat"
if exist "start-integrated-server.bat" del "start-integrated-server.bat"

echo Removing testing/diagnostic files...
if exist "test-system.bat" del "test-system.bat"
if exist "simple-db-test.bat" del "simple-db-test.bat"
if exist "check-servers.bat" del "check-servers.bat"
if exist "check-database-status.bat" del "check-database-status.bat"
if exist "fix-postgresql-startup.bat" del "fix-postgresql-startup.bat"
if exist "diagnose-postgresql.bat" del "diagnose-postgresql.bat"

echo Removing backend duplicate files...
if exist "backend\setup-postgres.bat" (
    del "backend\setup-postgres.bat"
    echo ✅ Removed backend\setup-postgres.bat
) else (
    echo ❌ Could not find backend\setup-postgres.bat
)

if exist "backend\setup-database.bat" (
    del "backend\setup-database.bat"
    echo ✅ Removed backend\setup-database.bat
) else (
    echo ❌ Could not find backend\setup-database.bat
)

echo.
echo ✅ Cleanup completed!
echo.
echo Remaining files:
echo - start.bat (main startup script)
echo - setup-postgresql.bat (one-time database setup)
echo - .env (environment configuration)
echo.
echo Use 'start.bat' to run the application
pause
