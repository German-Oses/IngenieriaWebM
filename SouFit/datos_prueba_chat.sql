-- Script para datos de prueba del chat con usernames
-- Asegúrate de tener al menos 2 usuarios para probar el chat

-- Primero ejecutar el script de configuración de seguimiento
-- (si no se ha ejecutado ya)

-- Insertar usuarios de prueba con usernames únicos
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

-- Verificar usuarios creados
SELECT id, username, nombre, apellido, email FROM usuario WHERE email IN ('juan@test.com', 'maria@test.com', 'carlos@test.com', 'ana@test.com', 'pedro@test.com');

-- Insertar algunos mensajes de prueba
-- (Reemplaza los IDs 1, 2, 3 con los IDs reales que aparezcan en la consulta anterior)
INSERT INTO mensaje (id_remitente, id_destinatario, contenido, fecha_envio) 
VALUES 
  (1, 2, 'Hola María! ¿Cómo vas con tu rutina?', NOW() - INTERVAL '2 hours'),
  (2, 1, 'Hola Juan! Todo bien, acabo de terminar mi entrenamiento', NOW() - INTERVAL '1 hour'),
  (1, 2, 'Genial! ¿Qué ejercicios hiciste hoy?', NOW() - INTERVAL '30 minutes'),
  (1, 3, 'Carlos, ¿vienes al gym mañana?', NOW() - INTERVAL '3 hours'),
  (3, 1, 'Sí, nos vemos a las 6 PM', NOW() - INTERVAL '2 hours');

-- Insertar algunos seguimientos de prueba
INSERT INTO seguimiento (id_seguidor, id_seguido) 
VALUES 
  (1, 2),  -- Juan sigue a María
  (1, 3),  -- Juan sigue a Carlos
  (2, 1),  -- María sigue a Juan
  (3, 4),  -- Carlos sigue a Ana
  (4, 1)   -- Ana sigue a Juan
ON CONFLICT (id_seguidor, id_seguido) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
  m.id,
  u1.username || ' (' || u1.nombre || ')' AS remitente,
  u2.username || ' (' || u2.nombre || ')' AS destinatario,
  m.contenido,
  m.fecha_envio
FROM mensaje m
JOIN usuario u1 ON m.id_remitente = u1.id
JOIN usuario u2 ON m.id_destinatario = u2.id
ORDER BY m.fecha_envio DESC;