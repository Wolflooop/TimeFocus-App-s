# TimeFocus — Backend Web

## Desarrollador

Josue Olearte Hernandez
Matricula: 240272
GitHub: @Josu03-MC
Universidad Tecnologica de Xicotepec de Juarez — Proyecto Integrador

---

## Descripcion

Modulo de API REST de la aplicacion TimeFocus. Desarrollado con Node.js, Express y MySQL. Expone los endpoints que consume tanto el frontend web como la aplicacion movil para gestionar usuarios, tareas, sesiones Pomodoro, horarios y notificaciones. Maneja la autenticacion mediante JWT y la encriptacion de contrasenas con bcryptjs.

---

## Que se hizo en este modulo

Se desarrollo la capa completa del servidor de datos, incluyendo la conexion a la base de datos, la inicializacion automatica de tablas, los controladores de cada recurso y todas las rutas de la API. Se implemento el sistema de autenticacion con tokens JWT, la encriptacion segura de contrasenas y un servicio de correo electronico para notificaciones al usuario.

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
- Inicializacion automatica de tablas al arrancar el servidor
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

## Rama de desarrollo

Este modulo fue desarrollado en la rama `backend-web` del repositorio
y posteriormente integrado a `main` mediante merge.
