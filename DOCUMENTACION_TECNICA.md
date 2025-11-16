# 📚 Documentación Técnica - SouFit

**Versión:** 1.0.0  
**Última actualización:** 2025  
**Proyecto:** SouFit - Plataforma Fitness Social

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Esquema de Base de Datos](#esquema-de-base-de-datos)
3. [API REST - Documentación Completa](#api-rest---documentación-completa)
4. [WebSocket (Socket.io)](#websocket-socketio)
5. [Seguridad](#seguridad)
6. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
7. [Despliegue](#despliegue)
8. [Optimizaciones](#optimizaciones)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Frontend
- **Framework:** Ionic 8 + Angular 20
- **Lenguaje:** TypeScript
- **Estado:** RxJS Observables
- **Comunicación en Tiempo Real:** Socket.io Client
- **Almacenamiento Local:** @ionic/storage-angular
- **Build:** Angular CLI

#### Backend
- **Runtime:** Node.js
- **Framework:** Express 5.1.0
- **Base de Datos:** PostgreSQL
- **ORM/Query:** pg (node-postgres)
- **Autenticación:** JWT (jsonwebtoken)
- **Encriptación:** bcryptjs
- **Validación:** express-validator
- **Comunicación en Tiempo Real:** Socket.io
- **Subida de Archivos:** Multer

#### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Servidor Web:** Nginx (producción)
- **Base de Datos:** PostgreSQL (contenedor)

### Arquitectura de Capas

```
┌─────────────────────────────────────┐
│         Frontend (Ionic)           │
│  ┌──────────┐  ┌──────────────┐   │
│  │  Pages   │  │   Services   │   │
│  └──────────┘  └──────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Socket.io Client          │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ HTTP/REST + WebSocket
┌──────────────▼──────────────────────┐
│      Backend (Express)              │
│  ┌──────────┐  ┌──────────────┐     │
│  │  Routes  │  │ Controllers  │     │
│  └──────────┘  └──────────────┘     │
│  ┌──────────┐  ┌──────────────┐     │
│  │Middleware│  │   Services   │     │
│  └──────────┘  └──────────────┘     │
│  ┌──────────────────────────────┐     │
│  │   Socket.io Server          │     │
│  └──────────────────────────────┘     │
└──────────────┬──────────────────────┘
               │ SQL Queries
┌──────────────▼──────────────────────┐
│      PostgreSQL Database            │
└─────────────────────────────────────┘
```

### Estructura de Directorios

```
SouFit/
├── BackEnd/
│   ├── config/           # Configuración (DB, etc.)
│   ├── controllers/      # Lógica de negocio
│   ├── middleware/       # Middlewares (auth, security, upload)
│   ├── routes/           # Definición de rutas API
│   ├── services/         # Servicios externos
│   ├── uploads/          # Archivos subidos por usuarios
│   ├── index.js          # Punto de entrada
│   └── package.json
│
├── FrontEnd/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/        # Páginas de la aplicación
│   │   │   ├── services/     # Servicios (API, auth, chat)
│   │   │   ├── components/   # Componentes reutilizables
│   │   │   └── interceptors/ # Interceptores HTTP
│   │   ├── assets/           # Recursos estáticos
│   │   └── environments/     # Configuración de entornos
│   └── package.json
│
├── Soufit.sql             # Script completo de base de datos
├── docker-compose.yml     # Configuración Docker
└── README.md
```

---

## 🗄️ Esquema de Base de Datos

### Diagrama de Entidad-Relación

El esquema de base de datos está diseñado para soportar una plataforma social de fitness con las siguientes entidades principales:

1. **Usuario y Autenticación**
2. **Seguimiento (Red Social)**
3. **Ejercicios**
4. **Rutinas**
5. **Mensajería**
6. **Posts (Feed)**
7. **Reacciones y Comentarios**
8. **Notificaciones**

### Tablas Principales

#### 1. `usuario`
Almacena información de los usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | SERIAL | PK, Identificador único |
| `username` | VARCHAR(100) | Username único |
| `email` | VARCHAR(100) | Email único |
| `password_hash` | TEXT | Hash de contraseña (bcrypt) |
| `nombre` | VARCHAR(100) | Nombre del usuario |
| `apellido` | VARCHAR(100) | Apellido del usuario |
| `avatar` | TEXT | URL del avatar |
| `bio` | TEXT | Biografía del usuario |
| `fecha_nacimiento` | DATE | Fecha de nacimiento |
| `id_region` | INT | FK a `region` |
| `id_comuna` | INT | FK a `comuna` |
| `fecha_registro` | TIMESTAMP | Fecha de registro |

**Índices:**
- `idx_usuario_email` en `email`
- `idx_usuario_username` en `username`

#### 2. `seguimiento`
Relación muchos-a-muchos entre usuarios (seguidores/seguidos).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_seguimiento` | SERIAL | PK |
| `id_seguidor` | INT | FK a `usuario` |
| `id_seguido` | INT | FK a `usuario` |
| `fecha_seguimiento` | TIMESTAMP | Fecha del seguimiento |

**Constraints:**
- `UNIQUE(id_seguidor, id_seguido)` - No se puede seguir dos veces
- `CHECK (id_seguidor != id_seguido)` - No se puede seguir a sí mismo

#### 3. `ejercicio`
Ejercicios del sistema y creados por usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_ejercicio` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `nombre_ejercicio` | VARCHAR(150) | Nombre del ejercicio |
| `descripcion` | TEXT | Descripción |
| `tipo` | VARCHAR(50) | Tipo (Fuerza, Cardio, etc.) |
| `url_media` | TEXT | URL de imagen/video |
| `es_sistema` | BOOLEAN | Si es ejercicio del sistema |
| `duracion_minutos` | INT | Duración estimada |
| `grupo_muscular` | VARCHAR(50) | Grupo muscular |
| `dificultad` | VARCHAR(20) | Principiante/Intermedio/Avanzado |
| `equipamiento` | VARCHAR(100) | Equipamiento necesario |
| `instrucciones` | TEXT | Instrucciones detalladas |
| `fecha_publicacion` | TIMESTAMP | Fecha de creación |

#### 4. `rutina`
Rutinas de ejercicio creadas por usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_rutina` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `nombre_rutina` | VARCHAR(150) | Nombre de la rutina |
| `descripcion` | TEXT | Descripción |
| `tipo_rutina` | VARCHAR(50) | Tipo de rutina |
| `duracion_semanas` | INT | Duración en semanas |
| `nivel_dificultad` | VARCHAR(20) | Principiante/Intermedio/Avanzado |
| `es_publica` | BOOLEAN | Si es pública |
| `fecha_creacion` | TIMESTAMP | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMP | Última actualización |

#### 5. `rutina_dia`
Días de la semana en una rutina.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_dia` | SERIAL | PK |
| `id_rutina` | INT | FK a `rutina` |
| `numero_dia` | INT | Número del día (1-7) |
| `nombre_dia` | VARCHAR(50) | Nombre del día |
| `descripcion` | TEXT | Descripción del día |
| `orden` | INT | Orden de ejecución |

#### 6. `rutina_ejercicio`
Ejercicios dentro de un día de rutina.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_rutina_ejercicio` | SERIAL | PK |
| `id_dia` | INT | FK a `rutina_dia` |
| `id_ejercicio` | INT | FK a `ejercicio` |
| `series` | INT | Número de series |
| `repeticiones` | VARCHAR(50) | Repeticiones |
| `peso_recomendado` | DECIMAL(5,2) | Peso recomendado |
| `descanso_segundos` | INT | Tiempo de descanso |
| `orden` | INT | Orden en el día |
| `notas` | TEXT | Notas adicionales |

#### 7. `mensaje`
Mensajes entre usuarios (soporta texto, imágenes y audio).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_mensaje` | SERIAL | PK |
| `id_remitente` | INT | FK a `usuario` |
| `id_destinatario` | INT | FK a `usuario` |
| `contenido` | TEXT | Contenido del mensaje (opcional) |
| `tipo_archivo` | VARCHAR(20) | 'imagen', 'audio', 'texto' |
| `url_archivo` | TEXT | URL del archivo subido |
| `nombre_archivo` | VARCHAR(255) | Nombre original del archivo |
| `leido` | BOOLEAN | Si fue leído |
| `fecha_envio` | TIMESTAMP | Fecha de envío |

**Constraints:**
- `CHECK (contenido IS NOT NULL OR url_archivo IS NOT NULL)` - Debe tener contenido o archivo

#### 8. `post`
Posts en el feed comunitario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_post` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `tipo_post` | VARCHAR(20) | 'ejercicio', 'rutina', 'logro', 'texto' |
| `contenido` | TEXT | Contenido del post |
| `url_media` | TEXT | URL de imagen/video |
| `id_ejercicio` | INT | FK a `ejercicio` (opcional) |
| `id_rutina` | INT | FK a `rutina` (opcional) |
| `fecha_publicacion` | TIMESTAMP | Fecha de publicación |
| `fecha_actualizacion` | TIMESTAMP | Última actualización |

#### 9. `reaccion`
Likes/reacciones a posts, ejercicios o rutinas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_reaccion` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `id_post` | INT | FK a `post` (opcional) |
| `id_ejercicio` | INT | FK a `ejercicio` (opcional) |
| `id_rutina` | INT | FK a `rutina` (opcional) |
| `tipo_reaccion` | VARCHAR(20) | Tipo de reacción (default: 'like') |
| `fecha_reaccion` | TIMESTAMP | Fecha de reacción |

**Constraints:**
- Solo uno de `id_post`, `id_ejercicio`, `id_rutina` puede ser NOT NULL
- Índice único para evitar reacciones duplicadas

#### 10. `comentario`
Comentarios en posts, ejercicios o rutinas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_comentario` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `id_post` | INT | FK a `post` (opcional) |
| `id_ejercicio` | INT | FK a `ejercicio` (opcional) |
| `id_rutina` | INT | FK a `rutina` (opcional) |
| `contenido` | TEXT | Contenido del comentario |
| `fecha_comentario` | TIMESTAMP | Fecha del comentario |
| `fecha_actualizacion` | TIMESTAMP | Última actualización |

#### 11. `compartido`
Compartidos de rutinas, ejercicios o posts.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_compartido` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `id_rutina` | INT | FK a `rutina` (opcional) |
| `id_ejercicio` | INT | FK a `ejercicio` (opcional) |
| `id_post` | INT | FK a `post` (opcional) |
| `fecha_compartido` | TIMESTAMP | Fecha del compartido |

#### 12. `notificacion`
Notificaciones del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_notificacion` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `tipo_notificacion` | VARCHAR(50) | Tipo de notificación |
| `titulo` | VARCHAR(200) | Título |
| `contenido` | TEXT | Contenido |
| `id_referencia` | INT | ID del elemento referenciado |
| `tipo_referencia` | VARCHAR(50) | Tipo del elemento referenciado |
| `leida` | BOOLEAN | Si fue leída |
| `fecha_notificacion` | TIMESTAMP | Fecha de notificación |

#### 13. `rutina_guardada`
Rutinas guardadas como favoritas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_guardado` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `id_rutina` | INT | FK a `rutina` |
| `fecha_guardado` | TIMESTAMP | Fecha de guardado |

**Constraints:**
- `UNIQUE(id_usuario, id_rutina)` - No se puede guardar dos veces

#### 14. `ejercicio_guardado`
Ejercicios guardados como favoritos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_guardado` | SERIAL | PK |
| `id_usuario` | INT | FK a `usuario` |
| `id_ejercicio` | INT | FK a `ejercicio` |
| `fecha_guardado` | TIMESTAMP | Fecha de guardado |

**Constraints:**
- `UNIQUE(id_usuario, id_ejercicio)` - No se puede guardar dos veces

#### 15. `region` y `comuna`
Datos geográficos de Chile.

- `region`: Regiones de Chile (16 regiones)
- `comuna`: Comunas de Chile (relacionadas con regiones)

### Índices para Optimización

El esquema incluye índices estratégicos para mejorar el rendimiento:

- **Usuarios:** email, username
- **Seguimiento:** seguidor, seguido
- **Ejercicios:** usuario, tipo, grupo_muscular, es_sistema
- **Rutinas:** usuario, es_publica
- **Posts:** usuario, fecha_publicacion (DESC)
- **Reacciones:** usuario, post, ejercicio, rutina (con índices únicos)
- **Mensajes:** remitente, destinatario, fecha_envio (DESC)
- **Notificaciones:** usuario, leida, fecha_notificacion (DESC)

---

## 🔌 API REST - Documentación Completa

### Base URL
```
http://localhost:3000/api
```

### Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT. El token debe enviarse en el header:

```
Authorization: Bearer <token>
```

### Endpoints de Autenticación

#### `POST /api/auth/register`
Registra un nuevo usuario.

**Acceso:** Público  
**Rate Limit:** 5 requests / 15 minutos

**Request Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@example.com",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

**Response 201:**
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id_usuario": 1,
    "username": "usuario123",
    "email": "usuario@example.com"
  }
}
```

**Errores:**
- `400`: Validación fallida
- `409`: Usuario o email ya existe

#### `POST /api/auth/login`
Inicia sesión y devuelve un token JWT.

**Acceso:** Público  
**Rate Limit:** 5 requests / 15 minutos

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id_usuario": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas

### Endpoints de Perfil

#### `GET /api/profile`
Obtiene el perfil del usuario autenticado.

**Acceso:** Privado (requiere JWT)

**Response 200:**
```json
{
  "id_usuario": 1,
  "username": "usuario123",
  "email": "usuario@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "avatar": "https://...",
  "bio": "Entusiasta del fitness",
  "fecha_nacimiento": "1990-01-01",
  "id_region": 5,
  "id_comuna": 1,
  "fecha_registro": "2025-01-01T00:00:00.000Z"
}
```

#### `PUT /api/profile`
Actualiza el perfil del usuario autenticado.

**Acceso:** Privado

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "bio": "Nueva biografía",
  "fecha_nacimiento": "1990-01-01",
  "id_region": 5,
  "id_comuna": 1
}
```

#### `PUT /api/profile/username`
Actualiza el username.

**Acceso:** Privado

**Request Body:**
```json
{
  "username": "nuevo_username"
}
```

#### `PUT /api/profile/password`
Cambia la contraseña.

**Acceso:** Privado

**Request Body:**
```json
{
  "password_actual": "password123",
  "password_nueva": "nueva_password456"
}
```

### Endpoints de Ubicación

#### `GET /api/ubicacion/regiones`
Obtiene todas las regiones de Chile.

**Acceso:** Público

**Response 200:**
```json
[
  {
    "id_region": 1,
    "nombre_region": "Tarapacá"
  },
  ...
]
```

#### `GET /api/ubicacion/comunas/:id_region`
Obtiene las comunas de una región específica.

**Acceso:** Público

**Response 200:**
```json
[
  {
    "id_comuna": 1,
    "nombre_comuna": "Iquique",
    "id_region": 1
  },
  ...
]
```

### Endpoints de Ejercicios

#### `GET /api/ejercicios`
Obtiene lista de ejercicios (con filtros opcionales).

**Acceso:** Público

**Query Parameters:**
- `tipo` (opcional): Filtro por tipo
- `grupo_muscular` (opcional): Filtro por grupo muscular
- `dificultad` (opcional): Principiante, Intermedio, Avanzado
- `es_sistema` (opcional): true/false
- `search` (opcional): Búsqueda por nombre

**Response 200:**
```json
[
  {
    "id_ejercicio": 1,
    "nombre_ejercicio": "Sentadillas",
    "descripcion": "Ejercicio fundamental...",
    "tipo": "Fuerza",
    "grupo_muscular": "Piernas",
    "dificultad": "Principiante",
    "es_sistema": true,
    ...
  },
  ...
]
```

#### `GET /api/ejercicios/:id`
Obtiene un ejercicio específico.

**Acceso:** Público

#### `POST /api/ejercicios`
Crea un nuevo ejercicio.

**Acceso:** Privado

**Request Body:**
```json
{
  "nombre_ejercicio": "Mi ejercicio",
  "descripcion": "Descripción...",
  "tipo": "Fuerza",
  "grupo_muscular": "Pecho",
  "dificultad": "Intermedio",
  "instrucciones": "Instrucciones..."
}
```

#### `PUT /api/ejercicios/:id`
Actualiza un ejercicio (solo el propietario).

**Acceso:** Privado

#### `DELETE /api/ejercicios/:id`
Elimina un ejercicio (solo el propietario).

**Acceso:** Privado

#### `POST /api/ejercicios/:id/guardar`
Guarda un ejercicio como favorito.

**Acceso:** Privado

#### `DELETE /api/ejercicios/:id/guardar`
Quita un ejercicio de favoritos.

**Acceso:** Privado

#### `GET /api/ejercicios/usuario/guardados`
Obtiene los ejercicios guardados del usuario.

**Acceso:** Privado

#### `POST /api/ejercicios/:id/reaccionar`
Reacciona (like) a un ejercicio.

**Acceso:** Privado

### Endpoints de Rutinas

#### `GET /api/rutinas`
Obtiene lista de rutinas públicas.

**Acceso:** Público

**Query Parameters:**
- `tipo_rutina` (opcional): Filtro por tipo
- `nivel_dificultad` (opcional): Principiante, Intermedio, Avanzado
- `search` (opcional): Búsqueda por nombre

#### `GET /api/rutinas/:id`
Obtiene una rutina específica (incluye días y ejercicios).

**Acceso:** Público

#### `GET /api/rutinas/usuario/mis-rutinas`
Obtiene las rutinas del usuario autenticado.

**Acceso:** Privado

#### `GET /api/rutinas/usuario/guardadas`
Obtiene las rutinas guardadas del usuario.

**Acceso:** Privado

#### `POST /api/rutinas`
Crea una nueva rutina.

**Acceso:** Privado

**Request Body:**
```json
{
  "nombre_rutina": "Mi Rutina",
  "descripcion": "Descripción...",
  "tipo_rutina": "Fuerza",
  "nivel_dificultad": "Intermedio",
  "es_publica": true,
  "dias": [
    {
      "numero_dia": 1,
      "nombre_dia": "Lunes",
      "ejercicios": [
        {
          "id_ejercicio": 1,
          "series": 3,
          "repeticiones": "10-12",
          "peso_recomendado": 50,
          "descanso_segundos": 60
        }
      ]
    }
  ]
}
```

#### `PUT /api/rutinas/:id`
Actualiza una rutina (solo el propietario).

**Acceso:** Privado

#### `DELETE /api/rutinas/:id`
Elimina una rutina (solo el propietario).

**Acceso:** Privado

#### `POST /api/rutinas/:id/guardar`
Guarda una rutina como favorita.

**Acceso:** Privado

#### `DELETE /api/rutinas/:id/guardar`
Quita una rutina de favoritos.

**Acceso:** Privado

#### `POST /api/rutinas/:id/reaccionar`
Reacciona (like) a una rutina.

**Acceso:** Privado

#### `POST /api/rutinas/:id/compartir`
Comparte una rutina.

**Acceso:** Privado

### Endpoints de Mensajería

#### `GET /api/chats`
Obtiene la lista de chats del usuario.

**Acceso:** Privado

**Response 200:**
```json
[
  {
    "id_usuario": 2,
    "nombre": "María García",
    "ultimo_mensaje": "Hola!",
    "fecha_ultimo_mensaje": "2025-01-15T10:30:00.000Z",
    "avatar": "https://...",
    "en_linea": false
  },
  ...
]
```

#### `GET /api/mensajes/:otroUsuarioId`
Obtiene el historial de mensajes con un usuario específico.

**Acceso:** Privado

**Response 200:**
```json
[
  {
    "id_mensaje": 1,
    "id_remitente": 1,
    "id_destinatario": 2,
    "contenido": "Hola!",
    "tipo_archivo": null,
    "url_archivo": null,
    "nombre_archivo": null,
    "fecha_envio": "2025-01-15T10:00:00.000Z",
    "leido": true
  },
  ...
]
```

#### `POST /api/mensajes/enviar`
Envía un mensaje (puede incluir archivo: imagen o audio).

**Acceso:** Privado  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `id_destinatario`: ID del destinatario
- `contenido` (opcional): Texto del mensaje
- `archivo` (opcional): Archivo (imagen o audio)

**Response 200:**
```json
{
  "id_mensaje": 1,
  "id_remitente": 1,
  "id_destinatario": 2,
  "contenido": "Hola!",
  "tipo_archivo": "imagen",
  "url_archivo": "/uploads/mensajes/imagenes/archivo.jpg",
  "nombre_archivo": "foto.jpg",
  "fecha_envio": "2025-01-15T10:00:00.000Z",
  "leido": false
}
```

#### `PUT /api/mensajes/:idMensaje`
Actualiza el contenido de un mensaje (solo el remitente).

**Acceso:** Privado

**Request Body:**
```json
{
  "contenido": "Mensaje actualizado"
}
```

#### `DELETE /api/mensajes/:idMensaje`
Elimina un mensaje (solo el remitente, elimina también el archivo físico).

**Acceso:** Privado

#### `PUT /api/mensajes/marcar-leidos/:otroUsuarioId`
Marca todos los mensajes de un usuario como leídos.

**Acceso:** Privado

#### `GET /api/siguiendo`
Obtiene la lista de usuarios que sigue el usuario autenticado.

**Acceso:** Privado

#### `GET /api/seguidores`
Obtiene la lista de seguidores del usuario autenticado.

**Acceso:** Privado

#### `GET /api/usuarios-disponibles`
Obtiene usuarios disponibles para chatear (solo los que sigue o con los que chateó).

**Acceso:** Privado

#### `GET /api/buscar-usuario/:username`
Busca usuarios por username.

**Acceso:** Privado

#### `POST /api/seguir/:userId`
Sigue a un usuario.

**Acceso:** Privado

#### `DELETE /api/seguir/:userId`
Deja de seguir a un usuario.

**Acceso:** Privado

### Endpoints de Posts (Feed)

#### `GET /api/posts/feed`
Obtiene el feed de posts (usuarios seguidos + propios).

**Acceso:** Privado

**Query Parameters:**
- `limit` (opcional): Límite de resultados (default: 20)
- `offset` (opcional): Offset para paginación

**Response 200:**
```json
[
  {
    "id_post": 1,
    "id_usuario": 1,
    "tipo_post": "ejercicio",
    "contenido": "Acabo de completar...",
    "url_media": "https://...",
    "id_ejercicio": 1,
    "fecha_publicacion": "2025-01-15T10:00:00.000Z",
    "usuario": {
      "username": "usuario123",
      "nombre": "Juan",
      "avatar": "https://..."
    },
    "reacciones_count": 5,
    "comentarios_count": 2,
    "ya_reaccionado": false
  },
  ...
]
```

#### `GET /api/posts/usuario/:userId`
Obtiene los posts de un usuario específico.

**Acceso:** Privado

#### `POST /api/posts`
Crea un nuevo post.

**Acceso:** Privado

**Request Body:**
```json
{
  "tipo_post": "ejercicio",
  "contenido": "Acabo de completar...",
  "url_media": "https://...",
  "id_ejercicio": 1
}
```

#### `PUT /api/posts/:id`
Actualiza un post (solo el propietario).

**Acceso:** Privado

#### `DELETE /api/posts/:id`
Elimina un post (solo el propietario).

**Acceso:** Privado

#### `POST /api/posts/:id/reaccionar`
Reacciona (like) a un post.

**Acceso:** Privado

#### `POST /api/posts/:id/comentar`
Comenta un post.

**Acceso:** Privado

**Request Body:**
```json
{
  "contenido": "Excelente post!"
}
```

#### `GET /api/posts/:id/comentarios`
Obtiene los comentarios de un post.

**Acceso:** Privado

#### `POST /api/posts/:id/compartir`
Comparte un post.

**Acceso:** Privado

### Endpoints de Notificaciones

#### `GET /api/notificaciones`
Obtiene las notificaciones del usuario autenticado.

**Acceso:** Privado

**Query Parameters:**
- `limit` (opcional): Límite de resultados
- `solo_no_leidas` (opcional): true/false

**Response 200:**
```json
[
  {
    "id_notificacion": 1,
    "tipo_notificacion": "nuevo_seguidor",
    "titulo": "Nuevo seguidor",
    "contenido": "usuario456 comenzó a seguirte",
    "id_referencia": 2,
    "tipo_referencia": "usuario",
    "leida": false,
    "fecha_notificacion": "2025-01-15T10:00:00.000Z"
  },
  ...
]
```

#### `GET /api/notificaciones/contador`
Obtiene el contador de notificaciones no leídas.

**Acceso:** Privado

**Response 200:**
```json
{
  "contador": 5
}
```

#### `PUT /api/notificaciones/:id/leida`
Marca una notificación como leída.

**Acceso:** Privado

#### `PUT /api/notificaciones/todas/leidas`
Marca todas las notificaciones como leídas.

**Acceso:** Privado

#### `DELETE /api/notificaciones/:id`
Elimina una notificación.

**Acceso:** Privado

### Endpoints Externos

#### `GET /api/external/ejercicios`
Busca ejercicios en API externa (requiere autenticación).

**Acceso:** Privado

**Query Parameters:**
- `nombre` (opcional): Nombre del ejercicio
- `tipo` (opcional): Tipo de ejercicio
- `grupoMuscular` (opcional): Grupo muscular

---

## 🔌 WebSocket (Socket.io)

### Eventos del Cliente al Servidor

#### `connect`
El cliente se conecta al servidor.

**Autenticación:**
```javascript
socket.emit('autenticar', { token: 'jwt_token' });
```

#### `enviar_mensaje`
Envía un mensaje de texto en tiempo real.

**Payload:**
```json
{
  "id_destinatario": 2,
  "contenido": "Hola!"
}
```

### Eventos del Servidor al Cliente

#### `nuevo_mensaje`
Se emite cuando se recibe un nuevo mensaje.

**Payload:**
```json
{
  "id_mensaje": 1,
  "id_remitente": 1,
  "id_destinatario": 2,
  "contenido": "Hola!",
  "fecha_envio": "2025-01-15T10:00:00.000Z"
}
```

#### `mensaje_actualizado`
Se emite cuando se actualiza un mensaje.

#### `mensaje_eliminado`
Se emite cuando se elimina un mensaje.

**Payload:**
```json
{
  "id_mensaje": 1
}
```

#### `nueva_notificacion`
Se emite cuando hay una nueva notificación.

**Payload:**
```json
{
  "id_notificacion": 1,
  "tipo_notificacion": "nuevo_seguidor",
  "titulo": "Nuevo seguidor",
  "contenido": "usuario456 comenzó a seguirte"
}
```

### Salas (Rooms)

Los usuarios se unen a salas con el formato:
```
usuario_{id_usuario}
```

Esto permite enviar mensajes y notificaciones específicas a usuarios conectados.

---

## 🔒 Seguridad

### Medidas Implementadas

#### 1. Autenticación JWT
- Tokens con expiración configurable
- Verificación en cada request protegido
- Middleware `authmiddleware.js` para validar tokens

#### 2. Encriptación de Contraseñas
- **Algoritmo:** bcryptjs
- **Salt Rounds:** 10
- Las contraseñas nunca se almacenan en texto plano

#### 3. Protección SQL Injection
- **Método:** Uso exclusivo de parámetros preparados (`$1, $2, ...`)
- Todas las consultas usan `db.query(text, params)`
- Nunca se concatenan valores directamente en SQL

#### 4. Protección XSS (Cross-Site Scripting)
- **Middleware:** `sanitizeInput` en `middleware/security.js`
- Sanitización de entrada:
  - Remoción de tags HTML peligrosos
  - Escapado de caracteres especiales
  - Validación de tipos de datos

#### 5. CORS Seguro
- Lista blanca de orígenes permitidos
- Configuración en `index.js`:
  - `http://localhost:4200` (desarrollo)
  - `http://localhost:8100` (Ionic serve)
  - `process.env.FRONTEND_URL` (producción)
  - Dominios de Vercel y Render (regex)

#### 6. Rate Limiting
- **Middleware:** `express-rate-limit`
- **Límites:**
  - Autenticación: 5 requests / 15 minutos
  - General: 100 requests / 15 minutos

#### 7. Headers de Seguridad HTTP
- **Middleware:** `securityHeaders` en `middleware/security.js`
- Headers configurados:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (en producción)

#### 8. Validación de Entrada
- **Middleware:** `express-validator`
- Validación en rutas de registro y login
- Sanitización automática de datos

#### 9. Subida de Archivos Segura
- **Middleware:** `multer` con configuración de límites
- Validación de tipos MIME
- Límite de tamaño: 10MB
- Almacenamiento en carpetas específicas (`uploads/mensajes/imagenes`, `uploads/mensajes/audios`)

#### 10. Variables de Entorno
- Credenciales sensibles en `.env` (no se sube a Git)
- `.env` incluido en `.gitignore`

### Recomendaciones Adicionales

1. **HTTPS en Producción:** Usar certificados SSL/TLS
2. **Rotación de JWT_SECRET:** Cambiar periódicamente
3. **Logs de Seguridad:** Implementar logging de intentos fallidos
4. **Backup de Base de Datos:** Realizar backups periódicos
5. **Monitoreo:** Implementar herramientas de monitoreo (Sentry, etc.)

---

## ⚙️ Configuración y Variables de Entorno

### Archivo `.env` (BackEnd)

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=soufit_user
DB_PASSWORD=soufit_password
DB_DATABASE=soufit_db

# JWT
JWT_SECRET=tu-secret-key-muy-segura-generar-una-aleatoria
JWT_EXPIRES_IN=7d

# Servidor
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:4200
```

### Generar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Variables de Entorno Frontend

**`src/environments/environment.ts` (desarrollo):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

**`src/environments/environment.prod.ts` (producción):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.soufit.com/api',
  socketUrl: 'https://api.soufit.com'
};
```

---

## 🚀 Despliegue

### Opción 1: Docker Compose (Recomendado)

#### Desarrollo
```bash
docker-compose up -d --build
```

#### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Opción 2: Despliegue Manual

#### Backend
1. Instalar dependencias: `npm install`
2. Configurar `.env`
3. Ejecutar `Soufit.sql` en PostgreSQL
4. Iniciar servidor: `npm start`

#### Frontend
1. Instalar dependencias: `npm install`
2. Configurar `environment.prod.ts`
3. Build: `npm run build`
4. Servir con Nginx o servidor estático

### Opción 3: Plataformas Cloud

#### Backend (Render, Railway, Heroku)
1. Conectar repositorio
2. Configurar variables de entorno
3. Configurar base de datos PostgreSQL
4. Ejecutar `Soufit.sql` en la base de datos

#### Frontend (Vercel, Netlify)
1. Conectar repositorio
2. Configurar build command: `npm run build`
3. Configurar output directory: `www` o `dist`
4. Configurar variables de entorno

---

## ⚡ Optimizaciones

### Base de Datos

1. **Índices:** Ya implementados en el esquema
2. **Consultas Optimizadas:** Uso de JOINs eficientes
3. **Paginación:** Implementada en endpoints de feed y notificaciones
4. **Conexión Pool:** Configurado en `config/db.js`

### Backend

1. **Compresión:** Considerar `compression` middleware
2. **Caché:** Implementar Redis para sesiones y caché
3. **CDN:** Usar CDN para archivos estáticos (uploads)
4. **Logging:** Implementar sistema de logging estructurado

### Frontend

1. **Lazy Loading:** Cargar módulos bajo demanda
2. **Caché de Servicios:** Implementar caché en servicios HTTP
3. **Optimización de Imágenes:** Comprimir imágenes antes de subir
4. **Service Workers:** Implementar PWA para offline

### Recomendaciones Futuras

- [ ] Implementar Redis para caché y sesiones
- [ ] Migrar uploads a S3 o similar
- [ ] Implementar CDN para assets estáticos
- [ ] Agregar compresión gzip
- [ ] Implementar logging estructurado (Winston, Pino)
- [ ] Agregar métricas y monitoreo (Prometheus, Grafana)
- [ ] Implementar tests automatizados (Jest, Karma)

---

## 📝 Notas Adicionales

### Script SQL Principal

El archivo `Soufit.sql` es **idempotente**, lo que significa que puede ejecutarse múltiples veces sin errores. Utiliza `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING` para evitar duplicados.

### Migraciones

Si necesitas agregar nuevas columnas o tablas, crea scripts de migración separados siguiendo el patrón:
```sql
-- migracion_nombre.sql
ALTER TABLE tabla ADD COLUMN nueva_columna tipo;
```

### Versionado de API

Actualmente la API no tiene versionado. Para futuras versiones, considerar:
```
/api/v1/...
/api/v2/...
```

---

**Documentación generada para SouFit v1.0.0**  
**Última actualización:** 2025

