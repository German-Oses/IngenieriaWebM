#!/bin/bash

echo "========================================"
echo "  SOUFIT - Inicio con Docker"
echo "========================================"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker no está instalado"
    echo "Por favor instala Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose no está instalado"
    echo "Por favor instala docker-compose"
    exit 1
fi

echo "[1/2] Construyendo y levantando servicios..."
docker-compose up -d --build

echo ""
echo "[2/2] Esperando que los servicios inicien..."
sleep 10

echo ""
echo "========================================"
echo "  Servicios iniciados!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:80"
echo "Backend: http://localhost:3000"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para detener: docker-compose down"
echo ""
echo "Mostrando logs (Ctrl+C para salir)..."
echo ""

docker-compose logs -f

