-- ===============================================
-- SOUFIT DATABASE 
-- ===============================================
-- 1. Tabla de regiones
CREATE TABLE region (
    id_region SERIAL PRIMARY KEY,
    nombre_region VARCHAR(100) NOT NULL
);

-- 2. Tabla de comunas 
CREATE TABLE comuna (
    id_comuna SERIAL PRIMARY KEY,
    nombre_comuna VARCHAR(100) NOT NULL,
    id_region INT NOT NULL REFERENCES region(id_region)
);

-- 3. Tabla de usuarios
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    id_region INT REFERENCES region(id_region),
    id_comuna INT REFERENCES comuna(id_comuna),
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 4. Tabla de ejercicios
CREATE TABLE ejercicio (
    id_ejercicio SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nombre_ejercicio VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    url_media TEXT,
    fecha_publicacion TIMESTAMP DEFAULT NOW()
);

INSERT INTO region (nombre_region) VALUES
('Tarapacá'),
('Antofagasta'),
('Atacama'),
('Coquimbo'),
('Valparaíso'),
('Libertador General Bernardo O’Higgins'),
('Maule'),
('Ñuble'),
('Biobío'),
('La Araucanía'),
('Los Ríos'),
('Los Lagos'),
('Aysén del General Carlos Ibáñez del Campo'),
('Magallanes y de la Antártica Chilena'),
('Metropolitana de Santiago'),
('Arica y Parinacota');

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
-- Región 6: O’Higgins
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
('Coyhaique', 13), ('Lago Verde', 13), ('Aysén', 13), ('Cisnes', 13), ('Guaitecas', 13), ('Cochrane', 13), ('O’Higgins', 13), ('Tortel', 13), ('Chile Chico', 13), ('Río Ibáñez', 13),
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
('Arica', 16), ('Camarones', 16), ('Putre', 16), ('General Lagos', 16);
