-- Script de migración para agregar campos faltantes a la tabla usuario
-- Ejecutar en orden para actualizar la base de datos existente

-- 1. Agregar columnas si no existen
DO $$ 
BEGIN
    -- Agregar columna nombre
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuario' AND column_name='nombre') THEN
        ALTER TABLE usuario ADD COLUMN nombre VARCHAR(100);
    END IF;

    -- Agregar columna apellido  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuario' AND column_name='apellido') THEN
        ALTER TABLE usuario ADD COLUMN apellido VARCHAR(100);
    END IF;

    -- Agregar columna username si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuario' AND column_name='username') THEN
        ALTER TABLE usuario ADD COLUMN username VARCHAR(50) UNIQUE;
    END IF;

    -- Agregar columna avatar si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuario' AND column_name='avatar') THEN
        ALTER TABLE usuario ADD COLUMN avatar TEXT;
    END IF;
END $$;

-- 2. Actualizar usuarios existentes sin username con un valor temporal
UPDATE usuario 
SET username = 'user_' || id || '_' || EXTRACT(EPOCH FROM NOW())::text
WHERE username IS NULL OR username = '';

-- 3. Hacer que las columnas nombre, apellido y username sean NOT NULL
-- (después de asegurar que todos los registros tienen valores)

-- Solo si hay datos existentes, puedes ejecutar esto manualmente después de verificar:
-- ALTER TABLE usuario ALTER COLUMN nombre SET NOT NULL;
-- ALTER TABLE usuario ALTER COLUMN apellido SET NOT NULL;
-- ALTER TABLE usuario ALTER COLUMN username SET NOT NULL;

-- 4. Crear tabla de seguimiento si no existe
CREATE TABLE IF NOT EXISTS seguimiento (
    id SERIAL PRIMARY KEY,
    id_seguidor INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_seguido INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_seguimiento TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_seguidor, id_seguido),
    CHECK (id_seguidor != id_seguido)
);

-- 5. Verificar la estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuario' 
ORDER BY ordinal_position;

-- 6. Mostrar usuarios existentes
SELECT id, username, nombre, apellido, email FROM usuario LIMIT 5;