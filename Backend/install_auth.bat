@echo off
echo ========================================
echo Installing Authentication Dependencies
echo ========================================
echo.

pip install bcrypt==4.1.2 pyjwt==2.8.0

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now restart the backend server.
echo.
pause
