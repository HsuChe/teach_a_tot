@echo off
cd /d "%~dp0"
echo Starting Tutor...
node cli.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error encounted.
    pause
)
pause
