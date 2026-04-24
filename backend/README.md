# TimeFocus Backend

## Visión general

La carpeta `backend` agrupa los servicios del servidor que soportan la aplicación TimeFocus. Contiene dos APIs independientes:

- `web-backend`: API REST diseñada para el frontend web.
- `mobile-backend`: API REST diseñada para la app móvil, con soporte adicional para autenticación social, sincronización offline y gestión de datos académicos.

Ambos servicios usan Node.js, Express y MySQL como base, y manejan autenticación JWT para proteger rutas privadas.

## Servicios incluidos

### web-backend

API principal para el frontend web. Sus responsabilidades incluyen:

- Registro e inicio de sesión de usuarios con JWT
- Gestión de tareas (CRUD)
- Registro y consulta de sesiones Pomodoro
- Gestión de horarios y notificaciones
- Envío de correos mediante `nodemailer`
- Protección de rutas privadas y encriptación de contraseñas con `bcryptjs`

### mobile-backend

API para la aplicación móvil con funcionalidades adicionales:

- Autenticación local y con Google
- Restablecimiento de contraseña con códigos de verificación
- Sincronización offline de datos mediante cola de sincronización
- Gestión de catálogos académicos, calificaciones y eventos
- Historial de sesiones de estudio y estadísticas de usuario
- Rate limiting para reducir abuso y mejorar seguridad

## Estructura del directorio

```
backend/
├── README.md
├── mobile-backend/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── middlewares/
│       ├── routes/
│       └── services/
└── web-backend/
    ├── index.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── config/
        ├── controllers/
        ├── middlewares/
        ├── routes/
        └── services/
```

## Requisitos

- Node.js 18+ / npm 9+
- MySQL instalado y accesible
- Variables de entorno configuradas en cada servicio

## Configuración de entorno

Cada servicio incluye un archivo `.env.example`. Copia ese archivo a `.env` y define los valores según tu entorno.

Ejemplo:

```bash
cd backend/web-backend
cp .env.example .env

cd ../mobile-backend
cp .env.example .env
```

Variables comunes principales:

- `PORT`: Puerto donde corre el servicio
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Conexión a MySQL
- `JWT_SECRET`: Clave secreta para tokens JWT
- `MAIL_USER`, `MAIL_PASS`: Credenciales para envío de correo (web-backend)

## Instalación y ejecución

### web-backend

```bash
cd backend/web-backend
npm install
npm run dev
```

O para producción:

```bash
npm start
```

### mobile-backend

```bash
cd backend/mobile-backend
npm install
npm run dev
```

O para producción:

```bash
npm start
```

## Inicialización de la base de datos

Ambos proyectos incluyen un script para inicializar o migrar la base de datos.

```bash
cd backend/web-backend
npm run db:init

cd backend/mobile-backend
npm run db:init
```

## Notas importantes

- Los dos servicios son independientes: pueden ejecutar en puertos distintos y conectar a la misma base de datos o a bases separadas según la arquitectura.
- `web-backend` está orientado a la versión web y ofrece endpoints clásicos de tareas, sesiones, horarios y notificaciones.
- `mobile-backend` integra flujos móviles adicionales: Google Sign-In, recuperación de contraseña, perfil, calificaciones, eventos, estadísticas y sincronización offline.
- Revisa las rutas de cada servicio en sus carpetas `src/routes` para conocer la API completa.

## Enlaces rápidos

- `backend/web-backend`: API para frontend web
- `backend/mobile-backend`: API para app móvil

## Autores

- Josue Olearte Hernandez


