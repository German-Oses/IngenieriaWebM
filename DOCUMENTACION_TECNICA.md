# 📚 Documentación Técnica - SouFit

**Versión:** 1.1.0  
**Última actualización:** 2025-01-16  
**Proyecto:** SouFit - Plataforma Fitness Social

## 🌐 Aplicación en Producción

### URLs de Producción

**Frontend (Vercel.com):**  
🔗 [https://soufit.vercel.app](https://soufit.vercel.app)

**Backend API (Render.com):**  
🔗 [https://soufit.onrender.com/api](https://soufit.onrender.com/api)

**Socket.io (Render.com):**  
🔗 [https://soufit.onrender.com](https://soufit.onrender.com)

**Health Check Endpoint:**  
🔗 [https://soufit.onrender.com/api/health](https://soufit.onrender.com/api/health)

**Base de Datos:**  
PostgreSQL alojada en Render.com (acceso interno)

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
9. [Características Avanzadas](#características-avanzadas)
10. [Responsive Design y PWA](#responsive-design-y-pwa)

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
- **PWA:** Service Worker (@angular/service-worker)
- **Notificaciones:** Web Notification API
- **Tema:** Modo oscuro/claro con ThemeService
- **Caché:** CacheService para respuestas API

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
- **Email:** Nodemailer (soporta MailerSend, Gmail, SMTP genérico)

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
│   │   │   ├── services/     # Servicios (API, auth, chat, theme, cache, notification)
│   │   │   ├── components/   # Componentes reutilizables
│   │   │   └── interceptors/ # Interceptores HTTP
│   │   ├── assets/           # Recursos estáticos
│   │   ├── environments/     # Configuración de entornos
│   │   ├── manifest.json     # Web App Manifest (PWA)
│   │   └── ngsw-config.json  # Service Worker config
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

#### Índices de Usuario
- `idx_usuario_email` en `email`
- `idx_usuario_username` en `username`
- `idx_usuario_region` en `id_region`
- `idx_usuario_comuna` en `id_comuna`

#### Índices de Post
- `idx_post_usuario` en `id_usuario`
- `idx_post_tipo` en `tipo_post`
- `idx_post_fecha` en `fecha_publicacion DESC`
- `idx_post_ejercicio` en `id_ejercicio` (parcial, WHERE id_ejercicio IS NOT NULL)
- `idx_post_rutina` en `id_rutina` (parcial, WHERE id_rutina IS NOT NULL)

#### Índices de Mensaje
- `idx_mensaje_remitente` en `id_remitente`
- `idx_mensaje_destinatario` en `id_destinatario`
- `idx_mensaje_fecha` en `fecha_envio DESC`
- `idx_mensaje_conversacion` en `(id_remitente, id_destinatario, fecha_envio DESC)`

#### Índices de Seguimiento
- `idx_seguimiento_seguidor` en `id_seguidor`
- `idx_seguimiento_seguido` en `id_seguido`
- `idx_seguimiento_unique` único en `(id_seguidor, id_seguido)`

#### Índices de Reacción
- `idx_reaccion_post` en `id_post`
- `idx_reaccion_usuario` en `id_usuario`
- `idx_reaccion_unique` único en `(id_post, id_usuario)`

#### Índices de Comentario
- `idx_comentario_post` en `id_post`
- `idx_comentario_usuario` en `id_usuario`
- `idx_comentario_fecha` en `fecha_comentario DESC`

#### Índices de Ejercicio
- `idx_ejercicio_grupo_muscular` en `grupo_muscular`
- `idx_ejercicio_nombre` en `nombre_ejercicio`

#### Índices de Rutina
- `idx_rutina_usuario` en `id_usuario`
- `idx_rutina_nombre` en `nombre_rutina`

---

## 🔌 API REST - Documentación Completa

### Base URL

**Desarrollo:**
```
http://localhost:3000/api
```

**Producción:**
```
https://soufit.onrender.com/api
```

### Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT. El token debe enviarse en el header:

```
Authorization: Bearer <token>
```

### Endpoints de Autenticación

#### `POST /api/auth/register`
Registra un nuevo usuario y crea la cuenta inmediatamente.

**Acceso:** Público  
**Rate Limit:** 5 requests / 15 minutos

**Request Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@example.com",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "1990-01-01",
  "id_region": 5,
  "id_comuna": 1
}
```

**Response 201:**
```json
{
  "message": "Cuenta creada exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "usuario@example.com"
  }
}
```

**Nota:** Después del registro, el usuario recibe un token JWT y queda autenticado automáticamente. No se requiere verificación de email.

**Errores:**
- `400`: Validación fallida (fecha de nacimiento obligatoria, formato inválido, etc.)
- `409`: Usuario o email ya existe
- `500`: Error del servidor

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

#### `POST /api/auth/solicitar-recuperacion`
Solicita un código de recuperación de contraseña por email.

**Acceso:** Público  
**Rate Limit:** 5 requests / 15 minutos

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response 200:**
```json
{
  "message": "Si el correo existe, se enviará un código de recuperación",
  "codigo": "123456"
}
```

**Nota:** En desarrollo, el código se devuelve en la respuesta. En producción, se envía por email.

**Errores:**
- `400`: Email inválido
- `404`: Usuario no encontrado

#### `POST /api/auth/resetear-password`
Valida el código y restablece la contraseña.

**Acceso:** Público  
**Rate Limit:** 5 requests / 15 minutos

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "codigo": "123456",
  "nuevaPassword": "nueva_password123"
}
```

**Response 200:**
```json
{
  "message": "Contraseña restablecida correctamente"
}
```

**Errores:**
- `400`: Código inválido o expirado
- `404`: Usuario no encontrado


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
- `busqueda` (opcional): Búsqueda por nombre
- `duracion_max` (opcional): Duración máxima en minutos
- `ordenar_por` (opcional): 'relevancia', 'nombre', 'duracion'
- `limit` (opcional): Límite de resultados
- `offset` (opcional): Offset para paginación

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

#### `GET /api/mensajes/contador-no-leidos`
Obtiene el contador de mensajes no leídos del usuario autenticado.

**Acceso:** Privado

**Response 200:**
```json
{
  "total": 5
}
```

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
- `tipo` (opcional): Filtro por tipo ('texto', 'ejercicio', 'rutina', 'logro')
- `orden` (opcional): Ordenamiento ('recientes', 'populares')

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

### Endpoints de Estadísticas

#### `GET /api/estadisticas`
Obtiene las estadísticas del usuario autenticado.

**Acceso:** Privado

**Response 200:**
```json
{
  "estadisticas": {
    "total_posts": 15,
    "total_rutinas": 5,
    "total_siguiendo": 20,
    "total_seguidores": 35,
    "total_likes_posts": 120,
    "total_comentarios_posts": 45,
    "total_rutinas_guardadas": 8
  },
  "actividad_reciente": [
    {
      "fecha": "2025-01-15",
      "cantidad": 3
    }
  ]
}
```

#### `GET /api/estadisticas/rutinas`
Obtiene el progreso de las rutinas del usuario.

**Acceso:** Privado

**Response 200:**
```json
[
  {
    "id_rutina": 1,
    "nombre_rutina": "Rutina de Fuerza",
    "duracion_semanas": 8,
    "fecha_creacion": "2025-01-01T00:00:00.000Z",
    "posts_completados": 5,
    "total_dias": 24
  }
]
```

### Endpoints de Recordatorios

#### `GET /api/recordatorios`
Obtiene los recordatorios de entrenamiento del usuario.

**Acceso:** Privado

**Response 200:**
```json
[
  {
    "id_recordatorio": 1,
    "id_usuario": 1,
    "hora": "18:00:00",
    "dias_semana": [1, 3, 5],
    "mensaje": "¡Es hora de entrenar!",
    "activo": true,
    "fecha_creacion": "2025-01-15T00:00:00.000Z"
  }
]
```

**Nota:** `dias_semana` es un array de números donde 0=Domingo, 1=Lunes, ..., 6=Sábado.

#### `POST /api/recordatorios`
Crea un nuevo recordatorio de entrenamiento.

**Acceso:** Privado

**Request Body:**
```json
{
  "hora": "18:00:00",
  "dias_semana": [1, 3, 5],
  "mensaje": "¡Es hora de entrenar!",
  "activo": true
}
```

#### `PUT /api/recordatorios/:id`
Actualiza un recordatorio existente.

**Acceso:** Privado

#### `DELETE /api/recordatorios/:id`
Elimina un recordatorio.

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
Se emite cuando se crea una nueva notificación para el usuario.

**Payload:**
```json
{
  "id_notificacion": 1,
  "tipo_notificacion": "nuevo_like",
  "titulo": "Nueva reacción en tu post",
  "contenido": "usuario123 reaccionó a tu post",
  "id_referencia": 5,
  "tipo_referencia": "post",
  "leida": false,
  "fecha_notificacion": "2025-01-15T10:00:00.000Z"
}
```

**Tipos de notificaciones:**
- `nuevo_mensaje` - Nuevo mensaje recibido
- `nuevo_like` - Nueva reacción en un post
- `nuevo_comentario` - Nuevo comentario en un post
- `nuevo_compartido` - Post compartido
- `nuevo_seguidor` - Nuevo seguidor
- `rutina_guardada` - Rutina guardada por otro usuario
- `nuevo_comentario_rutina` - Nuevo comentario en una rutina

#### `unirse_notificaciones`
El cliente se une a su sala de notificaciones.

**Payload:**
```javascript
socket.emit('unirse_notificaciones', id_usuario);
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
- **Middleware:** Implementación personalizada en `middleware/security.js`
- **Límites:**
  - Autenticación: 100 requests / 15 minutos (producción)
  - General: 100 requests / 15 minutos (producción), 1000 requests / minuto (desarrollo)
- No aplica a peticiones OPTIONS (preflight CORS)

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
- Validación estricta de tipos MIME:
  - **Imágenes:** JPEG, JPG, PNG, GIF, WebP (máx. 5MB)
  - **Audio:** MP3, WAV, OGG, WebM (máx. 10MB)
- Validación de extensiones de archivo
- Middleware adicional `validateFileSize` para validar tamaño por tipo
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

# Email Service (MailerSend - Recomendado - Sin dominio requerido)
MAILERSEND_API_TOKEN=mlsn.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=MS_xxxxx@trial-xxxxx.mlsender.net

# Email Service (Gmail - Alternativa)
# GMAIL_USER=tu_email@gmail.com
# GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion_gmail
# EMAIL_FROM=tu_email@gmail.com

# Email Service (SMTP Genérico - Alternativa)
# SMTP_HOST=smtp.tu-proveedor.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=tu_email@tudominio.com
# SMTP_PASS=tu_contraseña
# EMAIL_FROM=tu_email@tudominio.com
```

**📖 Ver `SouFit/BackEnd/CONFIGURACION_EMAIL.md` para instrucciones detalladas de configuración de email.**

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
  apiUrl: 'https://soufit.onrender.com/api',
  socketUrl: 'https://soufit.onrender.com'
};
```

**URLs de Producción:**
- **Frontend:** [https://soufit.vercel.app](https://soufit.vercel.app)
- **Backend API:** [https://soufit.onrender.com/api](https://soufit.onrender.com/api)
- **Socket.io:** [https://soufit.onrender.com](https://soufit.onrender.com)
- **Health Check:** [https://soufit.onrender.com/api/health](https://soufit.onrender.com/api/health)

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

### Opción 3: Plataformas Cloud (Producción Actual)

La aplicación está desplegada en:

#### Frontend - Vercel.com
- **URL:** [https://soufit.vercel.app](https://soufit.vercel.app)
- **Configuración:** Ver `SouFit/FrontEnd/DESPLIEGUE_VERCEL.md`
- **Build automático** en cada push a la rama principal
- **CDN global** automático
- **HTTPS** incluido

#### Backend - Render.com
- **URL:** [https://soufit.onrender.com](https://soufit.onrender.com)
- **API:** [https://soufit.onrender.com/api](https://soufit.onrender.com/api)
- **Health Check:** [https://soufit.onrender.com/api/health](https://soufit.onrender.com/api/health)
- **Configuración:** Ver `SouFit/BackEnd/DESPLIEGUE_RENDER.md`
- **Base de Datos:** PostgreSQL en Render.com

#### Guías de Despliegue
- **Guía Completa:** `SouFit/GUIA_DESPLIEGUE_COMPLETA.md`
- **Backend Render:** `SouFit/BackEnd/DESPLIEGUE_RENDER.md`
- **Frontend Vercel:** `SouFit/FrontEnd/DESPLIEGUE_VERCEL.md`
- **Configuración Email (MailerSend/Gmail/SMTP):** `SouFit/BackEnd/CONFIGURACION_EMAIL.md`

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

1. **Lazy Loading:** ✅ Implementado - Carga de módulos bajo demanda
2. **Caché de Servicios:** ✅ Implementado - `CacheService` con TTL configurable
3. **Optimización de Imágenes:** Lazy loading de imágenes con atributo `loading="lazy"`
4. **Service Workers:** ✅ Implementado - PWA configurada con `@angular/service-worker`
5. **Infinite Scroll:** ✅ Implementado - Carga paginada de posts en el feed
6. **Skeleton Loaders:** ✅ Implementado - Indicadores de carga mejorados

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

## 🎨 Características Avanzadas

### 1. Sistema de Notificaciones en Tiempo Real

#### Implementación
- **Backend:** `NotificationHelper` (`utils/notificationHelper.js`)
- **Frontend:** `NotificationService` (`src/app/services/notification.service.ts`)
- **Comunicación:** Socket.io para notificaciones en tiempo real
- **API:** Web Notification API nativa del navegador

#### Funcionalidades
- **Notificaciones en tiempo real** mediante Socket.io
- **Notificaciones push nativas** cuando la página está oculta
- **Tipos de notificaciones:**
  - Nuevos mensajes
  - Nuevos likes en posts
  - Nuevos comentarios en posts
  - Posts compartidos
  - Nuevos seguidores
  - Rutinas guardadas
  - Rutinas compartidas
- Solicitud automática de permisos al inicializar
- Notificaciones con icono, badge y vibración
- Manejo de clics en notificaciones para navegar a la aplicación
- Cierre automático después de 5 segundos

#### Uso
```typescript
// En el backend, usar NotificationHelper
await notificationHelper.notificarReaccionPost(postId, usuarioId);

// En el frontend
this.notificationService.showInteractionNotification(
  'Nueva reacción',
  'Usuario reaccionó a tu post'
);
```

### 2. Sistema de Estadísticas

#### Implementación
- **Backend:** `estadisticasController.js`
- **Frontend:** `EstadisticasService` (`src/app/services/estadisticas.service.ts`)
- **Endpoints:** `/api/estadisticas`

#### Funcionalidades
- Estadísticas generales del usuario:
  - Total de posts
  - Total de rutinas creadas
  - Total de seguidores y seguidos
  - Total de likes recibidos
  - Total de comentarios recibidos
  - Total de rutinas guardadas por otros usuarios
- Actividad reciente (últimos 30 días)
- Progreso de rutinas (posts completados vs total de días)

#### Endpoints
- `GET /api/estadisticas` - Obtener estadísticas generales
- `GET /api/estadisticas/rutinas` - Obtener progreso de rutinas

### 3. Sistema de Recordatorios de Entrenamiento

#### Implementación
- **Backend:** `recordatorioController.js`
- **Frontend:** `RecordatorioService` (`src/app/services/recordatorio.service.ts`)
- **Endpoints:** `/api/recordatorios`
- **Base de datos:** Tabla `recordatorio_entrenamiento` (creada dinámicamente)

#### Funcionalidades
- Crear recordatorios personalizados
- Configurar hora y días de la semana
- Mensaje personalizado
- Activar/desactivar recordatorios
- CRUD completo de recordatorios

#### Endpoints
- `GET /api/recordatorios` - Obtener recordatorios del usuario
- `POST /api/recordatorios` - Crear nuevo recordatorio
- `PUT /api/recordatorios/:id` - Actualizar recordatorio
- `DELETE /api/recordatorios/:id` - Eliminar recordatorio

### 4. Búsqueda Avanzada

#### Implementación
- **Backend:** Filtros mejorados en `ejercicioController.js`
- **Frontend:** `BuscarPage` con filtros avanzados

#### Funcionalidades
- Búsqueda por nombre o descripción
- Filtros por:
  - Tipo de ejercicio
  - Grupo muscular
  - Dificultad
  - Duración máxima
  - Equipamiento
- Ordenamiento por:
  - Relevancia (fecha)
  - Nombre (alfabético)
  - Duración
  - Likes
  - Guardados

### 5. Modo Oscuro

#### Implementación
- **Servicio:** `ThemeService` (`src/app/services/theme.service.ts`)
- **Persistencia:** LocalStorage
- **Opciones:** Light, Dark, System (sigue preferencia del sistema)

#### Funcionalidades
- Toggle de tema en el header
- Persistencia de preferencia entre sesiones
- Integración con Ionic dark mode
- Soporte para `prefers-color-scheme`

### 6. Caché en Frontend

#### Implementación
- **Servicio:** `CacheService` (`src/app/services/cache.service.ts`)
- **Almacenamiento:** LocalStorage con TTL (Time To Live)
- **Uso:** Caché automático de respuestas API

#### Funcionalidades
- TTL configurable por item
- Limpieza automática de items expirados
- Métodos: `set()`, `get()`, `remove()`, `clear()`

#### Ejemplo de Uso
```typescript
// Cachear feed por 2 minutos
this.cacheService.set('feed_todos_recientes_0', posts, 2 * 60 * 1000);

// Obtener del caché
const cached = await this.cacheService.get<Post[]>('feed_todos_recientes_0');
```

### 4. Búsqueda Avanzada

#### Filtros de Ejercicios
- **Grupo muscular:** Piernas, Pecho, Espalda, Brazos, Core, Cuerpo completo
- **Duración máxima:** Filtro por minutos
- **Ordenamiento:** Relevancia, Nombre, Duración

#### Filtros de Feed
- **Tipo:** Todos, Texto, Ejercicio, Rutina, Logro
- **Orden:** Recientes, Populares

### 5. Actualización en Tiempo Real Mejorada

#### ChatService Mejorado
- **Observables:** `nuevoMensaje$`, `contadorNoLeidos$`
- **Actualización automática:** Lista de chats se actualiza en tiempo real
- **Marcado automático:** Mensajes se marcan como leídos al abrir el chat
- **Contador preciso:** Endpoint backend para contador de no leídos

#### Eventos Socket.io
- `nuevo_mensaje`: Emitido cuando llega un mensaje nuevo
- `mensaje_actualizado`: Emitido cuando se actualiza un mensaje
- `mensaje_eliminado`: Emitido cuando se elimina un mensaje

---

## 📱 Responsive Design y PWA

### Diseño Responsive

#### Breakpoints
- **Móvil:** `max-width: 768px`
  - Menú lateral oculto
  - Header móvil con menú hamburguesa
  - Layout de una columna
- **Tablet:** `769px - 1024px`
  - Menú lateral reducido (70px)
  - Lista de chats ajustada (300px)
- **Escritorio:** `min-width: 1025px`
  - Layout completo con menú lateral visible
  - Header móvil oculto

#### Componentes Responsive
- Header móvil con botón de menú
- Menú móvil desplegable con overlay
- Badge de notificaciones en menú móvil
- Navegación adaptativa según tamaño de pantalla

### Progressive Web App (PWA)

#### Configuración
- **Manifest:** `src/manifest.json`
- **Service Worker:** `src/ngsw-config.json`
- **Registro:** Configurado en `main.ts`

#### Características PWA
- **Instalable:** Puede instalarse como app nativa
- **Offline:** Service Worker para caché de assets
- **Actualización:** Actualización automática en background
- **Iconos:** Configurados en manifest

#### Service Worker
- **Asset Groups:** Prefetch de archivos estáticos
- **Data Groups:** Caché de respuestas API (1 hora, estrategia freshness)
- **Estrategia:** Freshness para API, Prefetch para assets

#### Manifest.json
```json
{
  "name": "SouFit",
  "short_name": "SouFit",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3880ff",
  "icons": [...]
}
```

---

## 📊 Tabla de Recuperación de Contraseña

El sistema de recuperación de contraseña utiliza una tabla temporal para almacenar códigos:

```sql
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL
);
```

**Características:**
- Código de 6 dígitos
- Expiración: 15 minutos
- Un solo uso por código
- Limpieza automática de códigos expirados

---

**Documentación generada para SouFit v1.1.0**  
**Última actualización:** 2025-01-16

