-- Script para agregar funcionalidad de seguir usuarios por username

-- 1. Agregar campo username si no existe
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- 2. Agregar campo nombre y apellido si usa una estructura diferente
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 3. Crear tabla de seguimientos
CREATE TABLE IF NOT EXISTS seguimiento (
    id SERIAL PRIMARY KEY,
    id_seguidor INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_seguido INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_seguimiento TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_seguidor, id_seguido),
    CHECK (id_seguidor != id_seguido)
);

-- 4. Actualizar usuarios existentes con username temporal (si no tienen)
UPDATE usuario 
SET username = COALESCE(username, 'user_' || id || '_' || EXTRACT(EPOCH FROM NOW())::text)
WHERE username IS NULL;

-- 5. Agregar algunos usuarios de prueba con username
INSERT INTO usuario (nombre, apellido, email, contrasena, username, fecha_nacimiento) 
VALUES 
  ('Juan', 'Pérez', 'juan@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'juan_perez', '1990-01-01'),
  ('María', 'García', 'maria@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'maria_garcia', '1992-03-15'),
  ('Carlos', 'López', 'carlos@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'carlos_lopez', '1988-07-20'),
  ('Ana', 'Martínez', 'ana@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'ana_martinez', '1995-12-10'),
  ('Pedro', 'Sánchez', 'pedro@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', 'pedro_sanchez', '1987-05-22')
ON CONFLICT (email) DO UPDATE SET 
  username = EXCLUDED.username,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido;

-- 6. Verificar la estructura
SELECT 
  id, 
  username, 
  nombre || ' ' || apellido as nombre_completo, 
  email 
FROM usuario 
ORDER BY id;