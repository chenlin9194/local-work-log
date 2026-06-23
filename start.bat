@echo off
echo ========================================
echo   Local Work Hub
echo ========================================
echo.
echo Starting development server...
echo Access: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo ========================================

cd /d "%~dp0"

call npm.cmd run db:push
if errorlevel 1 goto :error

call npm.cmd run dev
if errorlevel 1 goto :error

goto :end

:error
echo.
echo Startup failed. Please check the error above.

:end

pause
