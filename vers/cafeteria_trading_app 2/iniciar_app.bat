@echo off
title BREW/DESK - Servidor de Cafeteria Trading
echo ========================================================
echo   Iniciando BREW/DESK (Cafeteria Trading App)
echo ========================================================
echo.

:: Cambiar al directorio del proyecto
cd /d "%~dp0"
if exist "cafeteria_trading_app" (
    cd cafeteria_trading_app
)

:: Agregar Flutter al PATH de la sesion por si acaso
set "PATH=%PATH%;C:\Flutter\flutter_windows_3.44.9-stable\flutter\bin"

echo Iniciando la aplicacion en Google Chrome...
echo.
echo Presiona Ctrl+C en esta consola para detener la aplicacion cuando desees.
echo.

call flutter run -d chrome

echo.
echo ========================================================
echo   La aplicacion se ha cerrado.
echo ========================================================
pause
