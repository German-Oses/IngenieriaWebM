# 🏋️ SouFit - Plataforma Fitness

**SouFit** es una aplicación web desarrollada como parte del proyecto universitario de Ingeniería Web.  
El objetivo es permitir a los usuarios registrarse, iniciar sesión, gestionar su perfil y acceder a funciones relacionadas con el entrenamiento físico.

Este proyecto incluye tanto el **Frontend (Ionic + Angular)** como el **Backend (Node.js + Express + PostgreSQL)**.

---

## 📁 Estructura del Proyecto

```
SouFit/
│
├── BackEnd/          # API REST - Node.js + Express + PostgreSQL
├── FrontEnd/         # Aplicación web - Ionic + Angular
├── Otros/            # Documentos, mockups, informe
│
└── README.md         # Este archivo
```

---

## 🚀 Tecnologías Principales

| Capa | Tecnologías |
|------|--------------|
| **Frontend** | Ionic, Angular (Standalone Components), TypeScript, RxJS |
| **Backend** | Node.js, Express, PostgreSQL |
| **Autenticación** | JSON Web Tokens (JWT), bcrypt.js |
| **Validación** | express-validator |
| **Almacenamiento local (Frontend)** | @ionic/storage-angular |

---

## 🧠 Funcionalidades Principales

### 🔐 Autenticación
- Registro e inicio de sesión con verificación en base de datos.
- Generación de **JWT** para sesiones seguras.
- Middleware de autenticación en el backend.
- Interceptor HTTP en el frontend para enviar el token automáticamente.

### 👤 Gestión de Usuario
- Consulta del perfil del usuario autenticado.
- Cierre de sesión y control de estado desde `AuthService`.

### 🌍 Ubicación
- Endpoints públicos para consultar **regiones y comunas** desde PostgreSQL.

---

## ⚙️ Instalación y Ejecución del Proyecto

### 🔹 1. Prerrequisitos
Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/es/) v18 o superior  
- [PostgreSQL](https://www.postgresql.org/download/)  
- (Opcional) Un gestor de base de datos como **pgAdmin** o **DBeaver**

---

### 🔹 2. Configuración del Backend

#### 📂 Ir a la carpeta del backend:
```bash
cd BackEnd
```

#### 📦 Instalar dependencias:
```bash
npm install
```

#### 🗄️ Crear la base de datos:
En PostgreSQL, crea una nueva base de datos llamada `soufitdb`:
```sql
CREATE DATABASE SouFit;
```

Luego, ejecuta el archivo `SouFit.sql` incluido para crear las tablas y precargar datos.

#### ⚙️ Configurar variables de entorno:
Crea un archivo `.env` en la carpeta `BackEnd/` con el siguiente contenido:

```
PORT=3000
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soufitdb
JWT_SECRET=clave_secreta_segura
```

*(Ajusta los valores según tu configuración local.)*

#### ▶️ Ejecutar el servidor:
```bash
npm run dev
```
El backend estará disponible en:  
👉 `http://localhost:3000`

---

### 🔹 3. Configuración del Frontend

#### 📂 Ir a la carpeta del frontend:
```bash
cd FrontEnd
```

#### 📦 Instalar dependencias:
```bash
npm install
```

#### ▶️ Iniciar la aplicación:
```bash
ionic serve
```
La aplicación se abrirá en:  
👉 `http://localhost:8100`

> ⚠️ **Nota:** Asegúrate de que el backend esté ejecutándose antes de abrir el frontend.

---

## 🧪 Endpoints de la API (Backend)

| Método | Ruta | Descripción | Acceso |
|:-------|:------|:-------------|:---------|
| `POST` | `/api/auth/register` | Registra un nuevo usuario | Público |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve un token JWT | Público |
| `GET` | `/api/profile` | Obtiene los datos del usuario autenticado | Privado |
| `GET` | `/api/ubicacion/regiones` | Lista todas las regiones | Público |
| `GET` | `/api/ubicacion/comunas/:id_region` | Lista las comunas por región | Público |

---

## 🧰 Dependencias Clave

### Backend
- express  
- pg  
- dotenv  
- bcryptjs  
- jsonwebtoken  
- express-validator  
- cors  
- nodemon *(para desarrollo)*

### Frontend
- @ionic/angular  
- @angular/core  
- @angular/router  
- @ionic/storage-angular  
- rxjs  
- ionicons  

---

## 🧾 Scripts Útiles

### Backend
| Comando | Descripción |
|:----------|:-------------|
| `npm run dev` | Inicia el servidor con nodemon |
| `npm start` | Inicia el servidor en modo producción |

### Frontend
| Comando | Descripción |
|:----------|:-------------|
| `ionic serve` | Levanta la app en el navegador |
| `ionic build` | Compila la app para producción |

---

## 🧑‍💻 Autores

**Proyecto SouFit**  
Desarrollado por:
- **Germán Oses**
- **Fernando Figueroa**
- **Joshua Villavicencio**

Pontificia Universidad Catolica De Valparaiso - 2025  

---

## 📄 Licencia
Este proyecto fue desarrollado con fines académicos.  
Todos los derechos reservados © 2025.
