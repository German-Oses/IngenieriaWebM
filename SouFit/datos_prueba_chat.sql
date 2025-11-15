-- Script para datos de prueba del chat
-- Asegúrate de tener al menos 2 usuarios para probar el chat

-- Insertar usuarios de prueba (si no existen)
INSERT INTO usuario (nombre, apellido, email, contrasena, fecha_nacimiento) 
VALUES 
  ('Juan', 'Pérez', 'juan@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', '1990-01-01'),
  ('María', 'García', 'maria@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', '1992-03-15'),
  ('Carlos', 'López', 'carlos@test.com', '$2a$10$DummyHashForTesting1234567890abcdefghijklmnopqr', '1988-07-20')
ON CONFLICT (email) DO NOTHING;

-- Verificar usuarios creados
SELECT id, nombre, apellido, email FROM usuario WHERE email IN ('juan@test.com', 'maria@test.com', 'carlos@test.com');

-- Insertar algunos mensajes de prueba
-- (Reemplaza los IDs 1, 2, 3 con los IDs reales que aparezcan en la consulta anterior)
INSERT INTO mensaje (id_remitente, id_destinatario, contenido, fecha_envio) 
VALUES 
  (1, 2, 'Hola María! ¿Cómo vas con tu rutina?', NOW() - INTERVAL '2 hours'),
  (2, 1, 'Hola Juan! Todo bien, acabo de terminar mi entrenamiento', NOW() - INTERVAL '1 hour'),
  (1, 2, 'Genial! ¿Qué ejercicios hiciste hoy?', NOW() - INTERVAL '30 minutes'),
  (1, 3, 'Carlos, ¿vienes al gym mañana?', NOW() - INTERVAL '3 hours'),
  (3, 1, 'Sí, nos vemos a las 6 PM', NOW() - INTERVAL '2 hours');

-- Verificar que se insertaron correctamente
SELECT 
  m.id,
  u1.nombre || ' ' || u1.apellido AS remitente,
  u2.nombre || ' ' || u2.apellido AS destinatario,
  m.contenido,
  m.fecha_envio
FROM mensaje m
JOIN usuario u1 ON m.id_remitente = u1.id
JOIN usuario u2 ON m.id_destinatario = u2.id
ORDER BY m.fecha_envio DESC;