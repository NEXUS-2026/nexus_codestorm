@echo off
echo Stopping any running Python processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo Starting server...
cd /d "%~dp0"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    python start_server.py
) else (
    python start_server.py
)
