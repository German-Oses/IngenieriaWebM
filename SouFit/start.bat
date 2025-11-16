@echo off
echo ========================================
echo   SOUFIT - Inicio Rapido
echo ========================================
echo.

echo [1/3] Iniciando Backend...
cd BackEnd
start "SouFit Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Esperando que el backend inicie...
timeout /t 5 /nobreak >nul

echo [3/3] Iniciando Frontend...
cd ..\FrontEnd
start "SouFit Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   Servicios iniciados!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

