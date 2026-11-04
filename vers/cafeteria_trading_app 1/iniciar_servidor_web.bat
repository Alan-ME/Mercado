@echo off
title BREW/DESK - Servidor Web
echo ========================================================
echo   Servidor Web BREW/DESK
echo ========================================================
echo.

cd /d "%~dp0"
if exist "cafeteria_trading_app" (
    cd cafeteria_trading_app
)

set "PATH=%PATH%;C:\Flutter\flutter_windows_3.44.9-stable\flutter\bin"

echo Iniciando servidor web...
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.

call flutter run -d web-server --web-port 8080 --web-hostname 127.0.0.1

echo.
echo ========================================================
echo   El servidor se ha detenido.
echo ========================================================
pause
