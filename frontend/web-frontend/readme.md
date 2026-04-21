# TimeFocus — Frontend Web

## Desarrollador

Josue Olearte Hernandez
Matricula: 240272
GitHub: @Josu03-MC
Universidad Tecnologica de Xicotepec de Juarez — Proyecto Integrador

---

## Descripcion

Modulo de interfaz web de la aplicacion TimeFocus. Desarrollado con Node.js y Express como servidor,
utilizando Pug como motor de plantillas para el renderizado del lado del servidor y Tailwind CSS para
los estilos. Se comunica con el backend web mediante peticiones HTTP para autenticar usuarios y
gestionar toda la informacion de la aplicacion.

---

## Caracteristicas

**Onboarding y autenticacion**
- Pantalla de bienvenida (splash) al ingresar a la aplicacion
- Pantalla de introduccion que presenta las funciones principales
- Formulario de registro con validacion y comunicacion real al backend
- Formulario de inicio de sesion con manejo de errores y redireccion automatica
- Cierre de sesion con limpieza de datos del servidor

**Navegacion y estructura**
- Layout base para pantallas publicas sin sidebar
- Layout principal con barra lateral para pantallas privadas
- Sidebar con acceso rapido a todas las secciones de la aplicacion
- Proteccion de rutas mediante middleware de autenticacion por sesion

**Dashboard**
- Panel principal con resumen del estado actual del usuario
- Acceso directo a las secciones mas utilizadas

**Temporizador Pomodoro**
- Vista interactiva con ciclos de trabajo y descanso
- Interfaz para iniciar, pausar y reiniciar sesiones

**Tareas**
- Vista general con listado de tareas del usuario
- Formulario para crear nuevas tareas con titulo, descripcion y prioridad

**Temas**
- Vista con los temas o materias registrados
- Formulario para crear nuevos temas de estudio

**Estadisticas**
- Vista dedicada al historial de sesiones y metricas de productividad

**Perfil de usuario**
- Informacion personal editable
- Configuracion de metas de estudio
- Preferencias de notificaciones
- Opciones de privacidad

---

## Estructura del proyecto

```
web-frontend/
├── app.js                              # Punto de entrada, configuracion de Express y rutas
├── package.json                        # Dependencias y scripts del proyecto
├── tailwind.config.js                  # Configuracion de Tailwind CSS
├── .env.example                        # Plantilla de variables de entorno
├── src/
│   ├── middlewares/
│   │   └── authWeb.js                  # Middleware que verifica sesion activa antes de cada ruta privada
│   └── public/
│       ├── css/
│       │   └── app.css                 # Estilos compilados con Tailwind CSS
│       └── js/
│           └── main.js                 # Logica del lado del cliente (interacciones, fetch)
└── views/
    ├── layouts/
    │   ├── base.pug                    # Layout sin sidebar, usado en onboarding y autenticacion
    │   └── app.pug                     # Layout principal con sidebar, usado en vistas privadas
    ├── partials/
    │   └── sidebar.pug                 # Barra lateral de navegacion reutilizable
    ├── onboarding/
    │   ├── splash.pug                  # Pantalla de inicio de la aplicacion
    │   ├── intro.pug                   # Presentacion de funciones principales
    │   ├── login.pug                   # Formulario de inicio de sesion
    │   └── registro.pug                # Formulario de registro de nuevo usuario
    ├── dashboard/
    │   └── index.pug                   # Panel principal del usuario autenticado
    ├── timer/
    │   └── index.pug                   # Temporizador Pomodoro interactivo
    ├── tareas/
    │   ├── index.pug                   # Listado de tareas del usuario
    │   └── nueva.pug                   # Formulario para crear nueva tarea
    ├── temas/
    │   ├── index.pug                   # Listado de temas de estudio
    │   └── nueva.pug                   # Formulario para crear nuevo tema
    ├── estadisticas/
    │   └── index.pug                   # Historial y metricas de sesiones
    └── perfil/
        ├── index.pug                   # Vista general del perfil
        ├── info.pug                    # Informacion personal editable
        ├── metas.pug                   # Configuracion de metas de estudio
        ├── notificaciones.pug          # Preferencias de notificaciones
        └── privacidad.pug              # Opciones de privacidad
```

---

## Tecnologias utilizadas

| Tecnologia      | Uso                                              |
|-----------------|--------------------------------------------------|
| Node.js         | Entorno de ejecucion del servidor                |
| Express         | Framework HTTP y manejo de rutas                 |
| Pug             | Motor de plantillas HTML renderizado en servidor |
| Tailwind CSS    | Estilos utilitarios                              |
| express-session | Gestion de sesiones de usuario                   |
| axios           | Peticiones HTTP hacia la API REST                |
| dotenv          | Variables de entorno                             |

---

## Variables de entorno

Copia el archivo de ejemplo y configura los valores:

```bash
cp .env.example .env
```

| Variable       | Descripcion                                     | Valor por defecto              |
|----------------|-------------------------------------------------|--------------------------------|
| PORT           | Puerto donde corre el servidor frontend         | 3001                           |
| API_URL        | URL base de la API REST del backend             | http://localhost:3000/api      |
| SESSION_SECRET | Clave secreta para firmar las cookies de sesion | timefocus_secreto              |

---

## Instalacion y ejecucion

**Requisitos previos**
- Node.js v18 o superior
- npm v9 o superior
- Backend web corriendo en el puerto configurado en API_URL

**Pasos**

```bash
# 1. Entrar al directorio
cd frontend/web-frontend

# 2. Copiar y configurar variables de entorno
cp .env.example .env

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor
node app.js
```

La interfaz queda disponible en: http://localhost:3001

---

## Flujo de autenticacion

1. El usuario envia el formulario de login o registro desde el navegador.
2. El servidor frontend recibe los datos y hace una peticion POST a la API REST.
3. Si la respuesta es exitosa, el token JWT se almacena en la sesion del servidor.
4. El middleware authWeb.js verifica la sesion antes de renderizar cualquier vista privada.
5. Si no hay sesion activa, redirige automaticamente al login.

---

## Rutas disponibles

| Metodo | Ruta               | Vista                     | Protegida |
|--------|--------------------|---------------------------|-----------|
| GET    | /                  | onboarding/splash.pug     | No        |
| GET    | /intro             | onboarding/intro.pug      | No        |
| GET    | /login             | onboarding/login.pug      | No        |
| POST   | /login             | Redirige al dashboard     | No        |
| GET    | /registro          | onboarding/registro.pug   | No        |
| POST   | /registro          | Redirige al login         | No        |
| GET    | /dashboard         | dashboard/index.pug       | Si        |
| GET    | /timer             | timer/index.pug           | Si        |
| GET    | /tareas            | tareas/index.pug          | Si        |
| GET    | /tareas/nueva      | tareas/nueva.pug          | Si        |
| GET    | /temas             | temas/index.pug           | Si        |
| GET    | /temas/nueva       | temas/nueva.pug           | Si        |
| GET    | /estadisticas      | estadisticas/index.pug    | Si        |
| GET    | /perfil            | perfil/index.pug          | Si        |
| GET    | /perfil/info       | perfil/info.pug           | Si        |
| GET    | /perfil/metas      | perfil/metas.pug          | Si        |
| GET    | /perfil/notif      | perfil/notificaciones.pug | Si        |
| GET    | /perfil/privacidad | perfil/privacidad.pug     | Si        |

---

## Rama de desarrollo

Este modulo fue desarrollado en la rama `frontend-web` del repositorio
y posteriormente integrado a `main` mediante merge.

```bash
git checkout frontend-web
```
