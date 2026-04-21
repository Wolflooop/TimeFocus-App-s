# TimeFocus — Backend Web

## Desarrollador

Josue Olearte Hernandez
Matricula: 240272
GitHub: @Josu03-MC
Universidad Tecnologica de Xicotepec de Juarez — Proyecto Integrador

---

## Descripcion

Modulo de API REST de la aplicacion TimeFocus. Desarrollado con Node.js, Express y MySQL.
Expone los endpoints que consume el frontend web para gestionar usuarios, tareas, sesiones
Pomodoro, horarios y notificaciones. Maneja la autenticacion mediante JWT y la encriptacion
de contrasenas con bcryptjs.

---

## Caracteristicas

**Autenticacion y seguridad**
- Registro de nuevos usuarios con validacion de datos
- Inicio de sesion con devolucion de token JWT
- Encriptacion de contrasenas con bcryptjs antes de almacenarlas
- Proteccion de rutas privadas mediante verificacion de token en cada peticion
- Manejo de errores de autenticacion con respuestas claras al cliente

**Base de datos**
- Conexion a MySQL configurada mediante variables de entorno
- Inicializacion automatica de tablas al arrancar el servidor si no existen
- Tablas para usuarios, tareas, sesiones, horarios y notificaciones

**Tareas**
- Creacion de tareas con titulo, descripcion y nivel de prioridad
- Consulta del listado completo de tareas por usuario
- Actualizacion de datos y estado de cada tarea
- Eliminacion de tareas

**Sesiones Pomodoro**
- Registro de cada sesion completada con duracion y fecha
- Consulta del historial de sesiones por usuario para estadisticas

**Horarios**
- Creacion de bloques de tiempo en el horario del usuario
- Consulta y eliminacion de bloques registrados

**Notificaciones**
- Consulta de notificaciones pendientes del usuario
- Marcado de notificaciones como leidas

**Servicio de correo**
- Envio de correos electronicos mediante nodemailer
- Utilizado para confirmaciones y alertas al usuario

---

## Estructura del proyecto

```
web-backend/
├── index.js                                # Punto de entrada, configuracion de Express y middlewares
├── package.json                            # Dependencias y scripts del proyecto
├── .env.example                            # Plantilla de variables de entorno
└── src/
    ├── config/
    │   ├── db.js                           # Conexion al servidor MySQL con mysql2
    │   └── initDB.js                       # Creacion automatica de tablas al iniciar el servidor
    ├── controllers/
    │   ├── authController.js               # Logica de registro y login, generacion de JWT
    │   ├── sessionController.js            # Logica de registro y consulta de sesiones Pomodoro
    │   ├── taskController.js               # Logica CRUD completo de tareas
    │   ├── scheduleController.js           # Logica de creacion y consulta de horarios
    │   └── notificationController.js       # Logica de consulta y actualizacion de notificaciones
    ├── routes/
    │   ├── auth.js                         # POST /api/auth/register, POST /api/auth/login
    │   ├── sessions.js                     # GET y POST /api/sessions
    │   ├── tasks.js                        # GET, POST, PUT, DELETE /api/tasks
    │   ├── schedule.js                     # GET, POST, DELETE /api/schedule
    │   └── notifications.js                # GET, PUT /api/notifications
    └── services/
        └── mailService.js                  # Configuracion de nodemailer y funciones de envio
```

---

## Tecnologias utilizadas

| Tecnologia   | Uso                                           |
|--------------|-----------------------------------------------|
| Node.js      | Entorno de ejecucion                          |
| Express      | Framework HTTP y gestion de rutas             |
| MySQL        | Base de datos relacional                      |
| mysql2       | Driver de conexion a MySQL desde Node.js      |
| jsonwebtoken | Generacion y verificacion de tokens JWT       |
| bcryptjs     | Encriptacion segura de contrasenas            |
| nodemailer   | Envio de correos electronicos                 |
| dotenv       | Carga de variables de entorno                 |
| cors         | Control de acceso entre dominios              |

---

## Variables de entorno

Copia el archivo de ejemplo y configura los valores:

```bash
cp .env.example .env
```

| Variable     | Descripcion                                                  |
|--------------|--------------------------------------------------------------|
| PORT         | Puerto donde corre el servidor de la API                     |
| DB_HOST      | Host del servidor MySQL, normalmente localhost               |
| DB_USER      | Usuario de MySQL                                             |
| DB_PASSWORD  | Contrasena del usuario de MySQL                              |
| DB_NAME      | Nombre de la base de datos a utilizar                        |
| JWT_SECRET   | Clave secreta para firmar los tokens JWT                     |
| MAIL_USER    | Correo electronico para el servicio de notificaciones        |
| MAIL_PASS    | Contrasena de aplicacion del correo, no la contrasena real   |

---

## Instalacion y ejecucion

**Requisitos previos**
- Node.js v18 o superior
- npm v9 o superior
- MySQL Workbench con una base de datos creada

**Pasos**

```bash
# 1. Entrar al directorio
cd backend/web-backend

# 2. Copiar y configurar variables de entorno
cp .env.example .env

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor
node index.js
```

La API queda disponible en: http://localhost:3000

Al iniciar, initDB.js crea automaticamente las tablas necesarias si no existen.

---

## Endpoints de la API

### Autenticacion

| Metodo | Ruta                | Descripcion                       | Autenticacion |
|--------|---------------------|-----------------------------------|---------------|
| POST   | /api/auth/register  | Registrar nuevo usuario           | No            |
| POST   | /api/auth/login     | Iniciar sesion, devuelve JWT      | No            |

### Tareas

| Metodo | Ruta                | Descripcion                       | Autenticacion |
|--------|---------------------|-----------------------------------|---------------|
| GET    | /api/tasks          | Obtener todas las tareas          | JWT           |
| POST   | /api/tasks          | Crear nueva tarea                 | JWT           |
| PUT    | /api/tasks/:id      | Actualizar tarea existente        | JWT           |
| DELETE | /api/tasks/:id      | Eliminar tarea                    | JWT           |

### Sesiones Pomodoro

| Metodo | Ruta                | Descripcion                       | Autenticacion |
|--------|---------------------|-----------------------------------|---------------|
| GET    | /api/sessions       | Obtener historial de sesiones     | JWT           |
| POST   | /api/sessions       | Registrar nueva sesion            | JWT           |

### Horarios

| Metodo | Ruta                | Descripcion                       | Autenticacion |
|--------|---------------------|-----------------------------------|---------------|
| GET    | /api/schedule       | Obtener horario del usuario       | JWT           |
| POST   | /api/schedule       | Crear bloque de horario           | JWT           |
| DELETE | /api/schedule/:id   | Eliminar bloque de horario        | JWT           |

### Notificaciones

| Metodo | Ruta                      | Descripcion                     | Autenticacion |
|--------|---------------------------|---------------------------------|---------------|
| GET    | /api/notifications        | Obtener notificaciones          | JWT           |
| PUT    | /api/notifications/:id    | Marcar como leida               | JWT           |

---

## Autenticacion con JWT

Las rutas protegidas requieren el token en el encabezado de cada peticion:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login exitoso en /api/auth/login.

---

## Rama de desarrollo

Este modulo fue desarrollado en la rama `backend-web` del repositorio
y posteriormente integrado a `main` mediante merge.

```bash
git checkout backend-web
```
