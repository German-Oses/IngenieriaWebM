# 🏋️ SouFit - Plataforma Fitness Social

**SouFit** es una aplicación web desarrollada como parte del proyecto universitario de Ingeniería Web.  
El objetivo es permitir a los usuarios registrarse, gestionar su perfil, buscar ejercicios, crear rutinas personalizadas, interactuar con otros usuarios y compartir contenido relacionado con el entrenamiento físico.

Este proyecto incluye tanto el **Frontend (Ionic + Angular)** como el **Backend (Node.js + Express + PostgreSQL)**.

---

## 📁 Estructura del Proyecto

```
SouFit/
│
├── BackEnd/              # API REST - Node.js + Express + PostgreSQL
│   ├── controllers/     # Controladores de rutas
│   ├── routes/          # Definición de rutas API
│   ├── middleware/      # Middlewares (auth, security)
│   ├── config/          # Configuración (DB, etc.)
│   └── .env             # Variables de entorno (NO se sube a Git)
│
├── FrontEnd/            # Aplicación web - Ionic + Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/   # Páginas de la aplicación
│   │   │   ├── services/ # Servicios (API, auth, chat)
│   │   │   └── ...
│   │   └── environments/ # Configuración de entornos
│   └── .env             # Variables de entorno (NO se sube a Git)
│
├── Soufit.sql                      # Script único de base de datos (esquema completo)
├── migracion_mensajes_multimedia.sql  # Script de migración para soporte multimedia
├── docker-compose.yml              # Configuración Docker para desarrollo
├── DOCUMENTACION_TECNICA.md        # Documentación técnica completa
│
└── README.md                       # Este archivo
```

---

## 🚀 Tecnologías Principales

| Capa | Tecnologías |
|------|--------------|
| **Frontend** | Ionic 8, Angular 20, TypeScript, RxJS, Socket.io Client |
| **Backend** | Node.js, Express, PostgreSQL, Socket.io |
| **Autenticación** | JSON Web Tokens (JWT), bcrypt.js |
| **Validación** | express-validator |
| **Seguridad** | Rate limiting, Sanitización XSS, CORS seguro |
| **Almacenamiento local (Frontend)** | @ionic/storage-angular |
| **Despliegue** | Docker, Docker Compose, Nginx |
| **Multimedia** | Multer (subida de archivos), Express Static |

---

## 🧠 Funcionalidades Principales

### ✅ Requerimientos Funcionales Implementados

- ✅ **RF-USR-01**: Registro de usuario
- ✅ **RF-USR-02**: Inicio de sesión
- ✅ **RF-USR-03**: Búsqueda de ejercicios en banco disponible
- ✅ **RF-USR-04**: Agregar amigos (seguir usuarios)
- ✅ **RF-USR-05**: Publicar rutinas de ejercicio
- ✅ **RF-USR-06**: Enviar mensajes a otros usuarios (tiempo real) + imágenes y audio
- ✅ **RF-USR-07**: Compartir rutinas o ejercicios
- ✅ **RF-USR-08**: Editar perfil personal
- ✅ **RF-USR-09**: Crear rutinas personalizadas
- ✅ **RF-USR-10**: Publicar ejercicios en feed comunitario

### 🔐 Autenticación y Seguridad
- Registro e inicio de sesión con verificación en base de datos
- Generación de **JWT** para sesiones seguras
- Middleware de autenticación en el backend
- Interceptor HTTP en el frontend para enviar el token automáticamente
- **Seguridad avanzada**: Protección SQL Injection, XSS, CORS seguro, Rate limiting

### 👤 Gestión de Usuario
- Consulta y edición del perfil del usuario autenticado
- Cambio de contraseña
- Cierre de sesión y control de estado

### 💬 Mensajería
- Mensajería en tiempo real con WebSocket (Socket.io)
- Historial de conversaciones
- Notificaciones de nuevos mensajes
- **Envío de imágenes y archivos de audio**
- Preview de archivos antes de enviar
- Visualización de multimedia en mensajes

### 🏋️ Ejercicios y Rutinas
- Banco de ejercicios (sistema y usuario)
- Búsqueda y filtrado de ejercicios
- Creación de rutinas personalizadas con días y ejercicios
- **Agregar días a rutinas existentes** (nuevo endpoint)
- Compartir rutinas y ejercicios
- Guardar como favoritos

### 📱 Feed Comunitario
- Publicar posts (ejercicios, rutinas, logros, texto)
- **Publicar posts solo con imagen** (contenido opcional)
- Reacciones (likes)
- Comentarios
- Feed de usuarios seguidos

### 🔔 Notificaciones
- Notificaciones en tiempo real
- Contador de no leídas
- Diferentes tipos: nuevos seguidores, mensajes, comentarios, likes, compartidos

---

## ⚙️ Instalación y Ejecución del Proyecto

### 🔹 Opción 1: Con Docker (Recomendado)

#### Prerrequisitos
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd SouFit
```

2. **Configurar variables de entorno**

Crear archivo `.env` en `BackEnd/`:
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=soufit_user
DB_PASSWORD=soufit_password
DB_DATABASE=soufit_db
JWT_SECRET=tu-secret-key-muy-segura-cambiar-en-produccion
FRONTEND_URL=http://localhost:80
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** 
- El archivo `.env` **NO se sube a Git** (está en `.gitignore`)
- Cambia `JWT_SECRET` por una clave segura en producción
- No compartas tus credenciales de base de datos

3. **Inicializar la base de datos**

Ejecutar el script SQL en el contenedor de PostgreSQL:
```bash
docker-compose up -d postgres
docker exec -i soufit-postgres psql -U soufit_user -d soufit_db < Soufit.sql
```

4. **Construir y ejecutar todos los servicios**
```bash
docker-compose up -d --build
```

5. **Acceder a la aplicación**
- **Frontend:** http://localhost:80
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432 (usuario: `soufit_user`, contraseña: `soufit_password`)

6. **Ver logs**
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo base de datos
docker-compose logs -f postgres
```

7. **Detener servicios**
```bash
# Detener sin eliminar volúmenes
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v
```

### 🔹 Opción 2: Desarrollo Local

#### Prerrequisitos
- [Node.js](https://nodejs.org/es/) v18 o superior  
- [PostgreSQL](https://www.postgresql.org/download/)  
- npm o yarn

#### Backend

1. **Navegar al directorio BackEnd**
```bash
cd BackEnd
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en `BackEnd/`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres
DB_DATABASE=soufit_db
JWT_SECRET=tu-secret-key-muy-segura-generar-una-aleatoria
FRONTEND_URL=http://localhost:4200
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu_usuario_postgres` y `tu_contraseña_postgres` con tus credenciales de PostgreSQL
- Genera un `JWT_SECRET` seguro (puedes usar: `openssl rand -base64 32`)
- El archivo `.env` **NO se sube a Git** por seguridad

4. **Configurar base de datos**

Crear la base de datos en PostgreSQL:
```bash
createdb soufit_db
```

Ejecutar el script SQL único (incluye todo el esquema):
```bash
psql -U tu_usuario -d soufit_db -f ../Soufit.sql
```

O desde la línea de comandos de PostgreSQL:
```sql
\i Soufit.sql
```

**Nota:** El archivo `Soufit.sql` contiene todo el esquema completo de la base de datos, incluyendo tablas, índices, datos iniciales de regiones/comunas y ejercicios del sistema.

**Si ya tienes una base de datos existente**, ejecuta también el script de migración para agregar soporte multimedia:
```bash
psql -U tu_usuario -d soufit_db -f migracion_mensajes_multimedia.sql
```

5. **Ejecutar el servidor**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

#### Frontend

1. **Navegar al directorio FrontEnd**
```bash
cd FrontEnd
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar API URL**

Editar `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Nota:** Si usas Docker, el `apiUrl` debe ser `http://localhost:3000/api` (el backend expone el puerto 3000).

4. **Ejecutar la aplicación**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

---

## 📚 Documentación

Para documentación técnica completa, consultar:
- **[DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md)**

Incluye:
- Arquitectura del sistema
- Esquema de base de datos
- Documentación completa de API REST
- Medidas de seguridad implementadas
- Guía de despliegue
- Optimizaciones

---

## 🔒 Seguridad

### Medidas Implementadas

1. **Autenticación JWT** con tokens con expiración
2. **Encriptación de contraseñas** con bcryptjs (salt rounds: 10)
3. **Protección SQL Injection**: Uso exclusivo de parámetros preparados
4. **Protección XSS**: Sanitización de entrada, remoción de tags HTML peligrosos
5. **CORS Seguro**: Lista blanca de orígenes permitidos
6. **Rate Limiting**: 
   - 5 intentos de login cada 15 minutos
   - 100 requests generales cada 15 minutos
7. **Headers de Seguridad HTTP**: X-Frame-Options, X-Content-Type-Options, etc.

---

## 🐳 Docker

### Servicios

- **postgres**: Base de datos PostgreSQL
- **backend**: API REST (Node.js + Express)
- **frontend**: Aplicación web (Nginx)

### Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reconstruir un servicio
docker-compose up -d --build backend

# Detener y eliminar volúmenes
docker-compose down -v
```

---

## 🧪 Testing

### Probar la API

Puedes usar herramientas como:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [curl](https://curl.se/)
- [Thunder Client](https://www.thunderclient.com/) (extensión de VS Code)

### Endpoints Principales

**Autenticación:**
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

**Perfil:**
- `GET /api/profile` - Obtener perfil (requiere autenticación)
- `PUT /api/profile` - Actualizar perfil

**Mensajería:**
- `GET /api/chats` - Obtener lista de chats
- `GET /api/mensajes/:otroUsuarioId` - Obtener historial de mensajes
- `POST /api/mensajes/enviar` - Enviar mensaje con archivo (imagen/audio)
- `PUT /api/mensajes/:idMensaje` - Actualizar mensaje
- `DELETE /api/mensajes/:idMensaje` - Eliminar mensaje

**Contenido:**
- `GET /api/posts/feed` - Obtener feed de posts
- `POST /api/posts` - Crear post (contenido opcional si hay imagen)
- `GET /api/ejercicios` - Listar ejercicios
- `GET /api/rutinas` - Listar rutinas
- `POST /api/rutinas/:id_rutina/dias` - Crear día en rutina (nuevo)
- `POST /api/rutinas/:id_rutina/ejercicios` - Agregar ejercicio a día

### Ejemplo de registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "nombre": "Test",
    "apellido": "User"
  }'
```

### Ejemplo de login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📝 Base de Datos

### Script SQL Principal

El proyecto utiliza un **único script SQL** (`Soufit.sql`) que incluye:
- ✅ Esquema completo de todas las tablas
- ✅ Índices para optimización
- ✅ Datos iniciales (regiones, comunas de Chile)
- ✅ Ejercicios del sistema
- ✅ Constraints y validaciones
- ✅ Soporte multimedia en mensajes (imágenes y audio)

### Ejecutar el Script Principal

**Opción 1: Desde línea de comandos**
```bash
psql -U tu_usuario -d soufit_db -f Soufit.sql
```

**Opción 2: Desde psql**
```sql
\c soufit_db
\i Soufit.sql
```

**Opción 3: Con Docker**
```bash
docker exec -i soufit-postgres psql -U soufit_user -d soufit_db < Soufit.sql
```

El script es **idempotente**, por lo que puede ejecutarse múltiples veces sin errores.

### Migración para Base de Datos Existente

Si ya tienes una base de datos creada con una versión anterior y necesitas agregar soporte multimedia a los mensajes, ejecuta el script de migración:

**Opción 1: Desde línea de comandos**
```bash
psql -U tu_usuario -d soufit_db -f migracion_mensajes_multimedia.sql
```

**Opción 2: Con Docker**
```bash
docker exec -i soufit-postgres psql -U soufit_user -d soufit_db < migracion_mensajes_multimedia.sql
```

**¿Qué hace la migración?**
- Agrega columnas `tipo_archivo`, `url_archivo` y `nombre_archivo` a la tabla `mensaje`
- Hace que `contenido` sea opcional (permite mensajes solo con archivo)
- Agrega constraint para asegurar que haya contenido O archivo

**Nota:** Si ejecutas `Soufit.sql` desde cero, no necesitas ejecutar la migración ya que incluye todas las columnas.

---

## 🔄 Métodos CRUD Implementados

### Mensajería (CRUD Completo)

✅ **CREATE:**
- `POST /api/mensajes/enviar` - Crear mensaje con archivo (imagen/audio)
- `Socket: 'enviar_mensaje'` - Crear mensaje de texto en tiempo real

✅ **READ:**
- `GET /api/mensajes/:otroUsuarioId` - Leer historial de mensajes
- `GET /api/chats` - Leer lista de chats

✅ **UPDATE:**
- `PUT /api/mensajes/:idMensaje` - Actualizar contenido de mensaje
- `PUT /api/mensajes/marcar-leidos/:otroUsuarioId` - Marcar mensajes como leídos

✅ **DELETE:**
- `DELETE /api/mensajes/:idMensaje` - Eliminar mensaje (incluye archivo físico)

**Características:**
- Solo el remitente puede editar/eliminar sus mensajes
- Eliminación automática de archivos físicos al eliminar mensajes
- Eventos Socket.IO para actualizaciones en tiempo real

### Otros Módulos

Todos los módulos principales (Posts, Ejercicios, Rutinas, Perfil) implementan operaciones CRUD completas. Consulta la [Documentación Técnica](./DOCUMENTACION_TECNICA.md) para más detalles.

---

## 🔧 Troubleshooting

### Problemas Comunes

**Error: "Cannot connect to database"**
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en el archivo `.env`
- Asegúrate de que la base de datos exista

**Error: "Port 3000 already in use"**
- Cambia el puerto en el archivo `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

**Error: "CORS policy"**
- Verifica que `FRONTEND_URL` en `.env` coincida con la URL del frontend
- Revisa la configuración de CORS en `BackEnd/index.js`

**Error al ejecutar `Soufit.sql`**
- Asegúrate de tener permisos en PostgreSQL
- Verifica que la base de datos exista antes de ejecutar el script
- El script es idempotente, puedes ejecutarlo múltiples veces

**Frontend no se conecta al backend**
- Verifica que el backend esté corriendo en el puerto correcto
- Revisa `apiUrl` en `FrontEnd/src/environments/environment.ts`
- Comprueba la consola del navegador para errores de CORS

**Error al enviar archivos en mensajería**
- Verifica que la carpeta `BackEnd/uploads/` exista y tenga permisos de escritura
- Revisa que multer esté instalado: `npm install multer` en `BackEnd/`
- Comprueba que el tamaño del archivo no exceda 10MB

---

## 🚧 Próximas Mejoras

- [ ] Tests automatizados (Jest, Karma)
- [ ] CI/CD pipeline
- [ ] Subida de imágenes a S3 o similar (actualmente se guardan localmente)
- [ ] Integración completa con API externa de ejercicios
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Analytics y métricas
- [ ] Grabación de audio directamente desde la app
- [ ] Compresión de imágenes antes de subir

---

## 📞 Soporte

Para más información técnica, consultar:
- [Documentación Técnica](./DOCUMENTACION_TECNICA.md)

---

## 📄 Licencia

Este proyecto es parte de un proyecto universitario.

---

**Versión**: 1.2.0  
**Última actualización**: 2025-01-27

---

## 📦 Archivos Importantes del Proyecto

- **`Soufit.sql`** - Script principal de base de datos (ejecutar primero en instalación nueva)
- **`.env`** - Variables de entorno (NO se sube a Git, usar `.env.example` como plantilla)
- **`docker-compose.yml`** - Configuración Docker para desarrollo
- **`docker-compose.prod.yml`** - Configuración Docker para producción
- **`DOCUMENTACION_TECNICA.md`** - Documentación técnica completa del proyecto

---

## 📋 Checklist de Instalación Rápida

### Para Desarrollo Local:
- [ ] Instalar Node.js v18+
- [ ] Instalar PostgreSQL
- [ ] Clonar repositorio
- [ ] Crear base de datos `soufit_db`
- [ ] Ejecutar `Soufit.sql`
- [ ] Configurar `.env` en `BackEnd/`
- [ ] `npm install` en `BackEnd/`
- [ ] `npm install` en `FrontEnd/`
- [ ] Configurar `apiUrl` en `environment.ts`
- [ ] Ejecutar `npm run dev` en BackEnd
- [ ] Ejecutar `npm start` en FrontEnd

### Para Docker:
- [ ] Instalar Docker y Docker Compose
- [ ] Clonar repositorio
- [ ] Crear `.env` en `BackEnd/`
- [ ] `docker-compose up -d postgres`
- [ ] Ejecutar `Soufit.sql` en el contenedor
- [ ] `docker-compose up -d --build`
