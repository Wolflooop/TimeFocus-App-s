# TimeFocus — Frontend Web

## Desarrollador

Josue Olearte Hernandez
Matricula: 240272
GitHub: @Josu03-MC
Universidad Tecnologica de Xicotepec de Juarez — Proyecto Integrador

---

## Descripcion

Modulo de interfaz web de la aplicacion TimeFocus. Desarrollado con Node.js y Express como servidor, utilizando Pug como motor de plantillas para el renderizado del lado del servidor y Tailwind CSS para los estilos. Se comunica con el backend web mediante peticiones HTTP para autenticar usuarios y gestionar toda la informacion de la aplicacion.

---

## Que se hizo en este modulo

Se desarrollo la capa visual completa de la aplicacion web, incluyendo todas las pantallas, la navegacion entre vistas y la conexion real con la API REST del backend. Se implemento un sistema de sesiones para proteger las rutas privadas y se construyo el flujo completo desde que el usuario abre la aplicacion hasta que opera dentro de ella.

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

## Tecnologias utilizadas

| Tecnologia      | Uso                                             |
|-----------------|-------------------------------------------------|
| Node.js         | Entorno de ejecucion del servidor               |
| Express         | Framework HTTP y manejo de rutas                |
| Pug             | Motor de plantillas HTML renderizado en servidor|
| Tailwind CSS    | Estilos utilitarios                             |
| express-session | Gestion de sesiones de usuario                  |
| axios           | Peticiones HTTP hacia la API REST               |
| dotenv          | Variables de entorno                            |

---

## Rama de desarrollo

Este modulo fue desarrollado en la rama `frontend-web` del repositorio
y posteriormente integrado a `main` mediante merge.
