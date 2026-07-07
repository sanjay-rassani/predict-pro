@echo off
REM Predict Pro - stop (Windows, double-clickable)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
echo.
pause
