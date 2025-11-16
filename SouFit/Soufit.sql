-- ===============================================
-- SOUFIT - ESQUEMA COMPLETO DE BASE DE DATOS
-- Script único y completo para toda la aplicación
-- ===============================================

-- ===============================================
-- 1. TABLAS BASE (Regiones y Comunas)
-- ===============================================

-- Tabla de Regiones
CREATE TABLE IF NOT EXISTS region (
    id_region SERIAL PRIMARY KEY,
    nombre_region VARCHAR(100) NOT NULL
);

-- Tabla de Comunas
CREATE TABLE IF NOT EXISTS comuna (
    id_comuna SERIAL PRIMARY KEY,
    nombre_comuna VARCHAR(100) NOT NULL,
    id_region INT NOT NULL REFERENCES region(id_region)
);

-- ===============================================
-- 2. TABLA DE USUARIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    avatar TEXT,
    bio TEXT,
    fecha_nacimiento DATE,
    id_region INT REFERENCES region(id_region),
    id_comuna INT REFERENCES comuna(id_comuna),
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 3. TABLA DE SEGUIMIENTO
-- ===============================================

CREATE TABLE IF NOT EXISTS seguimiento (
    id_seguimiento SERIAL PRIMARY KEY,
    id_seguidor INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_seguido INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    fecha_seguimiento TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_seguidor, id_seguido),
    CHECK (id_seguidor != id_seguido)
);

-- ===============================================
-- 4. TABLA DE EJERCICIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS ejercicio (
    id_ejercicio SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nombre_ejercicio VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    url_media TEXT,
    es_sistema BOOLEAN DEFAULT FALSE,
    duracion_minutos INT,
    grupo_muscular VARCHAR(50),
    dificultad VARCHAR(20) CHECK (dificultad IN ('Principiante', 'Intermedio', 'Avanzado')),
    equipamiento VARCHAR(100),
    instrucciones TEXT,
    fecha_publicacion TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 5. TABLA DE MENSAJES
-- ===============================================

CREATE TABLE IF NOT EXISTS mensaje (
    id_mensaje SERIAL PRIMARY KEY,
    id_remitente INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_destinatario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    contenido TEXT,
    tipo_archivo VARCHAR(20), -- 'imagen', 'audio', 'texto'
    url_archivo TEXT, -- URL del archivo subido
    nombre_archivo VARCHAR(255), -- Nombre original del archivo
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT NOW(),
    CHECK (contenido IS NOT NULL OR url_archivo IS NOT NULL) -- Debe tener contenido o archivo
);

-- ===============================================
-- 6. TABLA DE RUTINAS
-- ===============================================

CREATE TABLE IF NOT EXISTS rutina (
    id_rutina SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nombre_rutina VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_rutina VARCHAR(50),
    duracion_semanas INT,
    nivel_dificultad VARCHAR(20) CHECK (nivel_dificultad IN ('Principiante', 'Intermedio', 'Avanzado')),
    es_publica BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 7. TABLA DE DÍAS DE RUTINA
-- ===============================================

CREATE TABLE IF NOT EXISTS rutina_dia (
    id_dia SERIAL PRIMARY KEY,
    id_rutina INT NOT NULL REFERENCES rutina(id_rutina) ON DELETE CASCADE,
    numero_dia INT NOT NULL,
    nombre_dia VARCHAR(50),
    descripcion TEXT,
    orden INT DEFAULT 0
);

-- ===============================================
-- 8. TABLA DE EJERCICIOS EN RUTINA
-- ===============================================

CREATE TABLE IF NOT EXISTS rutina_ejercicio (
    id_rutina_ejercicio SERIAL PRIMARY KEY,
    id_dia INT NOT NULL REFERENCES rutina_dia(id_dia) ON DELETE CASCADE,
    id_ejercicio INT NOT NULL REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
    series INT,
    repeticiones VARCHAR(50),
    peso_recomendado DECIMAL(5,2),
    descanso_segundos INT,
    orden INT DEFAULT 0,
    notas TEXT
);

-- ===============================================
-- 9. TABLA DE POSTS (Feed Comunitario)
-- ===============================================

CREATE TABLE IF NOT EXISTS post (
    id_post SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_post VARCHAR(20) CHECK (tipo_post IN ('ejercicio', 'rutina', 'logro', 'texto')),
    contenido TEXT,
    url_media TEXT,
    id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE SET NULL,
    id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
    fecha_publicacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 10. TABLA DE REACCIONES (Likes)
-- ===============================================

CREATE TABLE IF NOT EXISTS reaccion (
    id_reaccion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_post INT REFERENCES post(id_post) ON DELETE CASCADE,
    id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
    id_rutina INT REFERENCES rutina(id_rutina) ON DELETE CASCADE,
    tipo_reaccion VARCHAR(20) DEFAULT 'like',
    fecha_reaccion TIMESTAMP DEFAULT NOW(),
    CHECK (
        (id_post IS NOT NULL AND id_ejercicio IS NULL AND id_rutina IS NULL) OR
        (id_post IS NULL AND id_ejercicio IS NOT NULL AND id_rutina IS NULL) OR
        (id_post IS NULL AND id_ejercicio IS NULL AND id_rutina IS NOT NULL)
    )
);

-- ===============================================
-- 11. TABLA DE COMENTARIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS comentario (
    id_comentario SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_post INT REFERENCES post(id_post) ON DELETE CASCADE,
    id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
    id_rutina INT REFERENCES rutina(id_rutina) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    CHECK (
        (id_post IS NOT NULL AND id_ejercicio IS NULL AND id_rutina IS NULL) OR
        (id_post IS NULL AND id_ejercicio IS NOT NULL AND id_rutina IS NULL) OR
        (id_post IS NULL AND id_ejercicio IS NULL AND id_rutina IS NOT NULL)
    )
);

-- ===============================================
-- 12. TABLA DE COMPARTIDOS
-- ===============================================

CREATE TABLE IF NOT EXISTS compartido (
    id_compartido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_rutina INT REFERENCES rutina(id_rutina) ON DELETE CASCADE,
    id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
    id_post INT REFERENCES post(id_post) ON DELETE CASCADE,
    fecha_compartido TIMESTAMP DEFAULT NOW(),
    CHECK (
        (id_rutina IS NOT NULL AND id_ejercicio IS NULL AND id_post IS NULL) OR
        (id_rutina IS NULL AND id_ejercicio IS NOT NULL AND id_post IS NULL) OR
        (id_rutina IS NULL AND id_ejercicio IS NULL AND id_post IS NOT NULL)
    )
);

-- ===============================================
-- 13. TABLA DE NOTIFICACIONES
-- ===============================================

CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT,
    id_referencia INT,
    tipo_referencia VARCHAR(50),
    leida BOOLEAN DEFAULT FALSE,
    fecha_notificacion TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 14. TABLA DE RUTINAS GUARDADAS
-- ===============================================

CREATE TABLE IF NOT EXISTS rutina_guardada (
    id_guardado SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_rutina INT NOT NULL REFERENCES rutina(id_rutina) ON DELETE CASCADE,
    fecha_guardado TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_usuario, id_rutina)
);

-- ===============================================
-- 15. TABLA DE EJERCICIOS GUARDADOS
-- ===============================================

CREATE TABLE IF NOT EXISTS ejercicio_guardado (
    id_guardado SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_ejercicio INT NOT NULL REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
    fecha_guardado TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_usuario, id_ejercicio)
);

-- ===============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===============================================

-- Índices en usuario
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);

-- Índices en seguimiento
CREATE INDEX IF NOT EXISTS idx_seguimiento_seguidor ON seguimiento(id_seguidor);
CREATE INDEX IF NOT EXISTS idx_seguimiento_seguido ON seguimiento(id_seguido);

-- Índices en ejercicio
CREATE INDEX IF NOT EXISTS idx_ejercicio_usuario ON ejercicio(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ejercicio_tipo ON ejercicio(tipo);
CREATE INDEX IF NOT EXISTS idx_ejercicio_grupo_muscular ON ejercicio(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_ejercicio_sistema ON ejercicio(es_sistema);

-- Índices en rutina
CREATE INDEX IF NOT EXISTS idx_rutina_usuario ON rutina(id_usuario);
CREATE INDEX IF NOT EXISTS idx_rutina_publica ON rutina(es_publica);

-- Índices en post
CREATE INDEX IF NOT EXISTS idx_post_usuario ON post(id_usuario);
CREATE INDEX IF NOT EXISTS idx_post_fecha ON post(fecha_publicacion DESC);

-- Índices en reaccion
CREATE INDEX IF NOT EXISTS idx_reaccion_usuario ON reaccion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reaccion_post ON reaccion(id_post);
CREATE INDEX IF NOT EXISTS idx_reaccion_ejercicio ON reaccion(id_ejercicio);
CREATE INDEX IF NOT EXISTS idx_reaccion_rutina ON reaccion(id_rutina);

-- Índices únicos para evitar reacciones duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_reaccion_usuario_post ON reaccion(id_usuario, id_post) WHERE id_post IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reaccion_usuario_ejercicio ON reaccion(id_usuario, id_ejercicio) WHERE id_ejercicio IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reaccion_usuario_rutina ON reaccion(id_usuario, id_rutina) WHERE id_rutina IS NOT NULL;

-- Índices en comentario
CREATE INDEX IF NOT EXISTS idx_comentario_post ON comentario(id_post);
CREATE INDEX IF NOT EXISTS idx_comentario_ejercicio ON comentario(id_ejercicio);
CREATE INDEX IF NOT EXISTS idx_comentario_rutina ON comentario(id_rutina);

-- Índices en mensaje
CREATE INDEX IF NOT EXISTS idx_mensaje_remitente ON mensaje(id_remitente);
CREATE INDEX IF NOT EXISTS idx_mensaje_destinatario ON mensaje(id_destinatario);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha ON mensaje(fecha_envio DESC);

-- Índices en notificacion
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario ON notificacion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON notificacion(leida);
CREATE INDEX IF NOT EXISTS idx_notificacion_fecha ON notificacion(fecha_notificacion DESC);

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Insertar Regiones de Chile
INSERT INTO region (id_region, nombre_region) VALUES
(1, 'Tarapacá'),
(2, 'Antofagasta'),
(3, 'Atacama'),
(4, 'Coquimbo'),
(5, 'Valparaíso'),
(6, 'Libertador General Bernardo O''Higgins'),
(7, 'Maule'),
(8, 'Ñuble'),
(9, 'Biobío'),
(10, 'La Araucanía'),
(11, 'Los Ríos'),
(12, 'Los Lagos'),
(13, 'Aysén del General Carlos Ibáñez del Campo'),
(14, 'Magallanes y de la Antártica Chilena'),
(15, 'Metropolitana de Santiago'),
(16, 'Arica y Parinacota')
ON CONFLICT (id_region) DO NOTHING;

-- Insertar Comunas de Chile
INSERT INTO comuna (nombre_comuna, id_region) VALUES
-- Región 1: Tarapacá
('Iquique', 1), ('Alto Hospicio', 1), ('Pozo Almonte', 1), ('Camiña', 1), ('Colchane', 1), ('Huara', 1), ('Pica', 1),
-- Región 2: Antofagasta
('Antofagasta', 2), ('Mejillones', 2), ('Sierra Gorda', 2), ('Taltal', 2), ('Calama', 2), ('Ollagüe', 2), ('San Pedro de Atacama', 2),
-- Región 3: Atacama
('Copiapó', 3), ('Caldera', 3), ('Tierra Amarilla', 3), ('Chañaral', 3), ('Diego de Almagro', 3), ('Vallenar', 3), ('Freirina', 3), ('Huasco', 3), ('Alto del Carmen', 3),
-- Región 4: Coquimbo
('La Serena', 4), ('Coquimbo', 4), ('Andacollo', 4), ('La Higuera', 4), ('Paihuano', 4), ('Vicuña', 4),
('Illapel', 4), ('Canela', 4), ('Los Vilos', 4), ('Salamanca', 4),
('Ovalle', 4), ('Combarbalá', 4), ('Monte Patria', 4), ('Punitaqui', 4), ('Río Hurtado', 4),
-- Región 5: Valparaíso
('Valparaíso', 5), ('Viña del Mar', 5), ('Concón', 5), ('Quilpué', 5), ('Villa Alemana', 5), ('Casablanca', 5),
('Quillota', 5), ('La Calera', 5), ('Hijuelas', 5), ('Nogales', 5),
('San Antonio', 5), ('Cartagena', 5), ('El Quisco', 5), ('El Tabo', 5), ('Algarrobo', 5),
('San Felipe', 5), ('Catemu', 5), ('Llaillay', 5), ('Panquehue', 5), ('Putaendo', 5), ('Santa María', 5),
('Los Andes', 5), ('Calle Larga', 5), ('Rinconada', 5), ('San Esteban', 5),
('Petorca', 5), ('Cabildo', 5), ('La Ligua', 5), ('Papudo', 5), ('Zapallar', 5),
('Isla de Pascua', 5),
-- Región 6: O'Higgins
('Rancagua', 6), ('Machalí', 6), ('Graneros', 6), ('Codegua', 6), ('Doñihue', 6), ('Coinco', 6),
('Coltauco', 6), ('Peumo', 6), ('Las Cabras', 6), ('Requínoa', 6), ('Rengo', 6), ('Malloa', 6), ('San Vicente', 6),
('San Fernando', 6), ('Chimbarongo', 6), ('Nancagua', 6), ('Placilla', 6), ('Santa Cruz', 6), ('Lolol', 6), ('Paredones', 6), ('Pumanque', 6), ('Peralillo', 6), ('Palmilla', 6), ('La Estrella', 6), ('Navidad', 6), ('Litueche', 6),
-- Región 7: Maule
('Talca', 7), ('San Clemente', 7), ('Pelarco', 7), ('Pencahue', 7), ('Maule', 7), ('Curepto', 7), ('Constitución', 7), ('Empedrado', 7),
('Linares', 7), ('Yerbas Buenas', 7), ('Colbún', 7), ('Longaví', 7), ('Retiro', 7), ('Parral', 7), ('Villa Alegre', 7), ('San Javier', 7),
('Cauquenes', 7), ('Chanco', 7), ('Pelluhue', 7),
-- Región 8: Ñuble
('Chillán', 8), ('Chillán Viejo', 8), ('San Carlos', 8), ('Coihueco', 8), ('San Nicolás', 8), ('Ñiquén', 8),
('Bulnes', 8), ('Quillón', 8), ('San Ignacio', 8), ('Pemuco', 8), ('El Carmen', 8),
('Yungay', 8), ('Pinto', 8), ('Cobquecura', 8), ('Trehuaco', 8), ('Coelemu', 8), ('Ninhue', 8), ('Portezuelo', 8), ('Quirihue', 8), ('Ránquil', 8), ('Treguaco', 8),
-- Región 9: Biobío
('Concepción', 9), ('Coronel', 9), ('San Pedro de la Paz', 9), ('Talcahuano', 9), ('Hualpén', 9), ('Chiguayante', 9),
('Florida', 9), ('Hualqui', 9), ('Penco', 9), ('Tomé', 9),
('Los Ángeles', 9), ('Laja', 9), ('San Rosendo', 9), ('Yumbel', 9), ('Cabrero', 9), ('Monte Águila', 9), ('Nacimiento', 9), ('Negrete', 9), ('Mulchén', 9), ('Quilaco', 9), ('Quilleco', 9), ('Santa Bárbara', 9), ('Alto Biobío', 9),
('Arauco', 9), ('Cañete', 9), ('Contulmo', 9), ('Curanilahue', 9), ('Lebu', 9), ('Los Álamos', 9), ('Tirúa', 9),
-- Región 10: La Araucanía
('Temuco', 10), ('Padre Las Casas', 10), ('Vilcún', 10), ('Lautaro', 10), ('Perquenco', 10), ('Galvarino', 10), ('Cunco', 10), ('Melipeuco', 10), ('Curarrehue', 10), ('Pucón', 10), ('Villarrica', 10), ('Freire', 10), ('Pitrufquén', 10), ('Gorbea', 10), ('Toltén', 10), ('Teodoro Schmidt', 10), ('Carahue', 10), ('Nueva Imperial', 10), ('Saavedra', 10), ('Cholchol', 10), ('Ercilla', 10), ('Collipulli', 10), ('Angol', 10), ('Renaico', 10), ('Purén', 10), ('Los Sauces', 10), ('Traiguén', 10), ('Lumaco', 10), ('Victoria', 10),
-- Región 11: Los Ríos
('Valdivia', 11), ('Corral', 11), ('Lanco', 11), ('Máfil', 11), ('Mariquina', 11), ('Paillaco', 11), ('Panguipulli', 11),
('La Unión', 11), ('Futrono', 11), ('Lago Ranco', 11), ('Río Bueno', 11),
-- Región 12: Los Lagos
('Puerto Montt', 12), ('Calbuco', 12), ('Cochamó', 12), ('Fresia', 12), ('Frutillar', 12), ('Los Muermos', 12), ('Llanquihue', 12), ('Maullín', 12), ('Puerto Varas', 12),
('Osorno', 12), ('Puero Octay', 12), ('Purranque', 12), ('Puyehue', 12), ('Río Negro', 12), ('San Juan de la Costa', 12), ('San Pablo', 12),
('Castro', 12), ('Ancud', 12), ('Chonchi', 12), ('Curaco de Vélez', 12), ('Dalcahue', 12), ('Puqueldón', 12), ('Queilén', 12), ('Quellón', 12), ('Quemchi', 12), ('Quinchao', 12),
-- Región 13: Aysén
('Coyhaique', 13), ('Lago Verde', 13), ('Aysén', 13), ('Cisnes', 13), ('Guaitecas', 13), ('Cochrane', 13), ('O''Higgins', 13), ('Tortel', 13), ('Chile Chico', 13), ('Río Ibáñez', 13),
-- Región 14: Magallanes
('Punta Arenas', 14), ('Laguna Blanca', 14), ('Río Verde', 14), ('San Gregorio', 14), ('Porvenir', 14), ('Primavera', 14), ('Timaukel', 14), ('Puerto Natales', 14), ('Torres del Paine', 14), ('Cabo de Hornos', 14), ('Antártica', 14),
-- Región 15: Metropolitana
('Santiago', 15), ('Cerrillos', 15), ('Cerro Navia', 15), ('Conchalí', 15), ('El Bosque', 15), ('Estación Central', 15),
('Huechuraba', 15), ('Independencia', 15), ('La Cisterna', 15), ('La Florida', 15), ('La Granja', 15), ('La Pintana', 15),
('La Reina', 15), ('Las Condes', 15), ('Lo Barnechea', 15), ('Lo Espejo', 15), ('Lo Prado', 15), ('Macul', 15),
('Maipú', 15), ('Ñuñoa', 15), ('Pedro Aguirre Cerda', 15), ('Peñalolén', 15), ('Providencia', 15), ('Pudahuel', 15),
('Quilicura', 15), ('Quinta Normal', 15), ('Recoleta', 15), ('Renca', 15), ('San Joaquín', 15), ('San Miguel', 15),
('San Ramón', 15), ('Vitacura', 15), ('Puente Alto', 15), ('Pirque', 15), ('San José de Maipo', 15),
('Colina', 15), ('Lampa', 15), ('Tiltil', 15), ('San Bernardo', 15), ('Buin', 15), ('Paine', 15), ('Calera de Tango', 15), ('Melipilla', 15), ('Alhué', 15), ('Curacaví', 15), ('María Pinto', 15), ('San Pedro', 15), ('Talagante', 15), ('El Monte', 15), ('Isla de Maipo', 15), ('Padre Hurtado', 15), ('Peñaflor', 15),
-- Región 16: Arica y Parinacota
('Arica', 16), ('Camarones', 16), ('Putre', 16), ('General Lagos', 16)
ON CONFLICT DO NOTHING;

-- ===============================================
-- EJERCICIOS DEL SISTEMA
-- ===============================================

-- Insertar ejercicios del sistema solo si existe al menos un usuario
DO $$
DECLARE
    primer_usuario_id INT;
BEGIN
    -- Obtener el ID del primer usuario
    SELECT COALESCE(MIN(id_usuario), 1) INTO primer_usuario_id FROM usuario;
    
    -- Si hay usuarios, insertar ejercicios del sistema
    IF primer_usuario_id IS NOT NULL THEN
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Sentadillas', 'Ejercicio fundamental para piernas y glúteos', 'Fuerza', 'Piernas', 'Principiante', TRUE, 15, '1. Párate con los pies separados al ancho de los hombros. 2. Baja el cuerpo como si fueras a sentarte. 3. Mantén la espalda recta. 4. Vuelve a la posición inicial.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Sentadillas' AND es_sistema = TRUE);
        
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Flexiones', 'Ejercicio para pecho, hombros y tríceps', 'Fuerza', 'Pecho', 'Intermedio', TRUE, 10, '1. Colócate en posición de plancha. 2. Baja el cuerpo hasta casi tocar el suelo. 3. Empuja hacia arriba.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Flexiones' AND es_sistema = TRUE);
        
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Plancha', 'Ejercicio isométrico para core', 'Fuerza', 'Core', 'Intermedio', TRUE, 8, '1. Colócate en posición de flexión. 2. Mantén el cuerpo recto. 3. Aguanta la posición.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Plancha' AND es_sistema = TRUE);
        
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Dominadas', 'Ejercicio para espalda y bíceps', 'Fuerza', 'Espalda', 'Avanzado', TRUE, 20, '1. Cuelga de una barra. 2. Tira del cuerpo hacia arriba. 3. Baja controladamente.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Dominadas' AND es_sistema = TRUE);
        
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Burpees', 'Ejercicio de cardio y fuerza', 'Cardio', 'Cuerpo completo', 'Avanzado', TRUE, 15, '1. Flexión. 2. Salto con brazos arriba. 3. Repite.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Burpees' AND es_sistema = TRUE);
        
        INSERT INTO ejercicio (id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, es_sistema, duracion_minutos, instrucciones)
        SELECT primer_usuario_id, 'Correr', 'Cardio básico', 'Cardio', 'Piernas', 'Principiante', TRUE, 30, '1. Calienta 5 minutos. 2. Corre a ritmo constante. 3. Enfría 5 minutos.'
        WHERE NOT EXISTS (SELECT 1 FROM ejercicio WHERE nombre_ejercicio = 'Correr' AND es_sistema = TRUE);
    END IF;
END $$;

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para tabla usuario
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);
CREATE INDEX IF NOT EXISTS idx_usuario_region ON usuario(id_region);
CREATE INDEX IF NOT EXISTS idx_usuario_comuna ON usuario(id_comuna);

-- Índices para tabla post
CREATE INDEX IF NOT EXISTS idx_post_usuario ON post(id_usuario);
CREATE INDEX IF NOT EXISTS idx_post_tipo ON post(tipo_post);
CREATE INDEX IF NOT EXISTS idx_post_fecha ON post(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_post_ejercicio ON post(id_ejercicio) WHERE id_ejercicio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_rutina ON post(id_rutina) WHERE id_rutina IS NOT NULL;

-- Índices para tabla mensaje
CREATE INDEX IF NOT EXISTS idx_mensaje_remitente ON mensaje(id_remitente);
CREATE INDEX IF NOT EXISTS idx_mensaje_destinatario ON mensaje(id_destinatario);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha ON mensaje(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion ON mensaje(id_remitente, id_destinatario, fecha_envio DESC);

-- Índices para tabla seguimiento
CREATE INDEX IF NOT EXISTS idx_seguimiento_seguidor ON seguimiento(id_seguidor);
CREATE INDEX IF NOT EXISTS idx_seguimiento_seguido ON seguimiento(id_seguido);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seguimiento_unique ON seguimiento(id_seguidor, id_seguido);

-- Índices para tabla reaccion
CREATE INDEX IF NOT EXISTS idx_reaccion_post ON reaccion(id_post);
CREATE INDEX IF NOT EXISTS idx_reaccion_usuario ON reaccion(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reaccion_unique ON reaccion(id_post, id_usuario);

-- Índices para tabla comentario
CREATE INDEX IF NOT EXISTS idx_comentario_post ON comentario(id_post);
CREATE INDEX IF NOT EXISTS idx_comentario_usuario ON comentario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_comentario_fecha ON comentario(fecha_comentario DESC);

-- Índices para tabla ejercicio
CREATE INDEX IF NOT EXISTS idx_ejercicio_grupo_muscular ON ejercicio(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_ejercicio_nombre ON ejercicio(nombre_ejercicio);

-- Índices para tabla rutina
CREATE INDEX IF NOT EXISTS idx_rutina_usuario ON rutina(id_usuario);
CREATE INDEX IF NOT EXISTS idx_rutina_nombre ON rutina(nombre_rutina);

-- ===============================================
-- FIN DEL SCRIPT
-- ===============================================

