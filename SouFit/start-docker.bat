@echo off
echo ========================================
echo   SOUFIT - Inicio con Docker
echo ========================================
echo.

echo Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta instalado o no esta en el PATH
    echo Por favor instala Docker Desktop
    pause
    exit /b 1
)

echo.
echo [1/2] Construyendo y levantando servicios...
docker-compose up -d --build

echo.
echo [2/2] Esperando que los servicios inicien...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Servicios iniciados!
echo ========================================
echo.
echo Frontend: http://localhost:80
echo Backend: http://localhost:3000
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener: docker-compose down
echo.
echo Presiona cualquier tecla para ver los logs...
pause >nul
docker-compose logs -f

