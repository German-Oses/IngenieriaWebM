# Presentado por:
- German Oses
- Fernando Figueroa  
- Joshua Villavicencio

# SouFit - Plataforma Fitness Social

## 🌐 Aplicación en Producción

**Frontend (Vercel):**  
🔗 [https://soufit.vercel.app](https://soufit.vercel.app)

**Backend API (Render):**  
🔗 [https://soufit.onrender.com/api](https://soufit.onrender.com/api)

**Health Check:**  
🔗 [https://soufit.onrender.com/api/health](https://soufit.onrender.com/api/health)

---

**Prototipo (Figma):**  
https://www.figma.com/proto/9t08ubjNySuxTx8rygZNhD/SouFit?node-id=105-2&t=KKxqOlVgdH00sgOZ-1

## Índice
1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Requerimientos](#requerimientos)
3. [Arquitectura de la Información](#arquitectura-de-la-información)
4. [Diseño de Prototipos](#diseño-de-prototipos)
5. [Tecnologías Implementadas](#tecnologías-implementadas)
6. [Configuración](#configuración)

## Resumen del Proyecto
SouFit es una plataforma fitness social desarrollada con Ionic y Angular que permite a los usuarios gestionar sus rutinas de ejercicio, conectar con otros entusiastas del fitness y compartir su progreso. La aplicación incluye funciones de social networking específicas para el ámbito fitness.

---

## Requerimientos

## Roles del Sistema
- **Usuario**: Puede gestionar su perfil, rutinas, ejercicios y interactuar socialmente.
- **Administrador**: Control total sobre el banco de ejercicios y moderación de contenido.

## Requerimientos Funcionales por Rol

### Rol-Usuario

- **RF-USR-01**: El usuario puede registrar una cuenta en el sistema.
- **RF-USR-02**: El usuario puede iniciar sesión en su cuenta.
- **RF-USR-03**: El usuario puede buscar ejercicios en el banco disponible.
- **RF-USR-04**: El usuario puede agregar amigos a su red social.
- **RF-USR-05**: El usuario puede publicar sus rutinas de ejercicio.
- **RF-USR-06**: El usuario puede enviar mensajes a otros usuarios.
- **RF-USR-07**: El usuario puede compartir rutinas o ejercicios.
- **RF-USR-08**: El usuario puede editar su perfil personal.
- **RF-USR-09**: El usuario puede crear rutinas personalizadas.
- **RF-USR-10**: El usuario puede publicar ejercicios en el feed comunitario.

### Rol-Administrador

- **RF-ADM-01**: El administrador puede editar ejercicios del banco de ejercicios.
- **RF-ADM-02**: El administrador puede agregar nuevos ejercicios al banco.

### Funcionalidades Opcionales
- **RF-OPT-01**: El sistema puede recomendar dietas al usuario.
- **RF-OPT-02**: El sistema puede recomendar rutinas al usuario.
- **RF-OPT-03**: El sistema puede recomendar ejercicios al usuario.
- **RF-OPT-04**: El usuario puede crear dietas personalizadas.

---

## Requerimientos No Funcionales

### RNF-01: Rendimiento y Concurrencia
- El sistema debe soportar que múltiples usuarios envíen mensajes simultáneamente.
- El sistema debe manejar los mensajes entre usuarios de tal manera en que se entreguen con un tiempo de retardo máximo de 2 segundos.

### RNF-02: Usabilidad
- La interfaz del sistema debe ser intuitiva, utilizando iconografía reconocible para cada funcionalidad.
- El sistema debe contar con modo oscuro y modo claro intercambiables.
- La interfaz del sistema debe adaptarse automáticamente a dispositivos móviles, tablets y escritorio (diseño responsivo).

### RNF-03: Multimedia
- El sistema debe permitir subir fotos y videos en alta definición (HD).

### RNF-04: Disponibilidad
- El sistema debe estar disponible las 24 horas del día, 7 días a la semana.

### RNF-05: Compatibilidad
- El sistema debe ser compatible con navegadores modernos y dispositivos iOS/Android a través de Ionic.

---

## Arquitectura de la Información

### Estructura de Navegación Principal


### Flujo de Inicio
1. **Pantalla de bienvenida** → Login/Registro
2. **Validación de credenciales**
3. **Carga de datos de usuario**
4. **Navegación al feed principal**

---

## Diseño de Prototipos

### Mockups Implementados
- **Inicio de sesión**: Interfaz limpia con campos para email y contraseña
- **Crear cuenta**: Formulario de registro con validación
- **Feed principal**: Timeline de publicaciones y rutinas compartidas
- **Agregar ejercicio** (admin): Formulario para expandir el banco de ejercicios
- **Mensajería**: Interfaz de chat estilo moderno

### Características de UI/UX
- **Design System** consistente con componentes Ionic
- **Navegación por tabs** para acceso rápido a secciones principales
- **Gestos móviles** implementados (swipe, pull-to-refresh)
- **Feedback visual** inmediato para todas las acciones

---

## Tecnologías Implementadas

### Framework Principal

### Front-end
- **Ionic Framework** (v7+)
- **Angular** (v15+)
- **TypeScript**

### Back-end
- **Node.js**
- **Express**
- **PostgreSQL**
- **Nodemailer** (Email: MailerSend, Gmail, SMTP genérico)

### Librerías y Herramientas
- **Ionic Components** (UI library nativa)
- **RxJS** (para programación reactiva)
- **Angular Router** (navegación entre vistas)
- **Capacitor** (para funcionalidades nativas)
- **SASS** (estilos y theming)

### Características Técnicas
- **Arquitectura modular** con lazy loading
- **Servicios injectables** para lógica de negocio
- **Guards** para protección de rutas
- **Interceptors** para manejo de HTTP requests
- **Storage nativo** para persistencia local

---

## Configuración

### Email Service

El sistema soporta múltiples proveedores de email:

- **MailerSend** (Recomendado): 12,000 correos gratis/mes, sin dominio requerido
- **Gmail**: 15,000 correos/mes, requiere contraseña de aplicación
- **SMTP Genérico**: Cualquier proveedor SMTP

**📖 Ver documentación completa:** `SouFit/BackEnd/CONFIGURACION_EMAIL.md`

### Documentación Técnica

Para información detallada sobre la arquitectura, API, base de datos y despliegue, consulta:

**📚 [Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)**

---

**Carrera**: Ingeniería en Informática  
**Asignatura**: Ingeniería web y móvil  
**Fecha de entrega**: 02 de noviembre  
**Ubicación**: Valparaíso, Chile
