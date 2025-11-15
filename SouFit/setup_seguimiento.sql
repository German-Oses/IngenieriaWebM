-- Script para agregar funcionalidad de seguir usuarios por username
-- EJECUTAR PRIMERO: migracion_usuario.sql

-- Ejecutar solo si ya se corrió la migración de usuario

-- 1. Crear tabla de seguimientos (si no existe)
CREATE TABLE IF NOT EXISTS seguimiento (
    id SERIAL PRIMARY KEY,
    id_seguidor INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_seguido INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_seguimiento TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_seguidor, id_seguido),
    CHECK (id_seguidor != id_seguido)
);

-- 2. Agregar algunos usuarios de prueba con username, nombre y apellido
INSERT INTO usuario (nombre, apellido, email, password_hash, username) 
VALUES 
  ('Juan', 'Pérez', 'juan@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'juan_perez'),
  ('María', 'García', 'maria@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'maria_garcia'),
  ('Carlos', 'López', 'carlos@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'carlos_lopez'),
  ('Ana', 'Martínez', 'ana@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'ana_martinez'),
  ('Pedro', 'Sánchez', 'pedro@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'pedro_sanchez')
ON CONFLICT (email) DO UPDATE SET 
  username = EXCLUDED.username,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido;

-- 3. Verificar la estructura
SELECT 
  id, 
  username, 
  nombre || ' ' || apellido as nombre_completo, 
  email 
FROM usuario 
ORDER BY id;