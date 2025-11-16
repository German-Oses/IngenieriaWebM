#!/bin/bash

echo "========================================"
echo "  SOUFIT - Inicio Rapido"
echo "========================================"
echo ""

echo "[1/3] Iniciando Backend..."
cd BackEnd
npm run dev &
BACKEND_PID=$!
sleep 5

echo "[2/3] Esperando que el backend inicie..."
sleep 3

echo "[3/3] Iniciando Frontend..."
cd ../FrontEnd
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Servicios iniciados!"
echo "========================================"
echo ""
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:4200"
echo ""
echo "PIDs:"
echo "  Backend: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Para detener los servicios, presiona Ctrl+C"
echo ""

# Esperar a que el usuario presione Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

