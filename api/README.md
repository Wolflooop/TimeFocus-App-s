# TimeFocus Public API

API pública REST para desarrolladores externos que quieran integrar sus aplicaciones con TimeFocus.

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

La API corre en `http://localhost:4000`
Documentación Swagger en `http://localhost:4000/docs`

## Autenticación

### 1. Registrarse
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "miPassword123"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "developer": { "id": 1, "name": "Juan Pérez", "email": "juan@ejemplo.com" },
    "api_key": "tf_live_a1b2c3d4...",
    "warning": "Guarda tu API Key, no se mostrará de nuevo"
  }
}
```

### 2. Usar la API Key
Incluye el header en todas tus peticiones:
```
X-API-Key: tf_live_a1b2c3d4...
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Crear cuenta de desarrollador |
| POST | `/api/v1/auth/login` | Iniciar sesión y ver API Keys |
| POST | `/api/v1/auth/keys` | Crear nueva API Key |
| DELETE | `/api/v1/auth/keys/:id` | Revocar API Key |
| GET | `/api/v1/tasks` | Listar tareas |
| POST | `/api/v1/tasks` | Crear tarea |
| GET | `/api/v1/tasks/:id` | Obtener tarea |
| PUT | `/api/v1/tasks/:id` | Actualizar tarea |
| DELETE | `/api/v1/tasks/:id` | Eliminar tarea |
| GET | `/api/v1/stats/summary` | Resumen de estudio |
| GET | `/api/v1/stats/daily` | Estadísticas diarias |
| GET | `/api/v1/stats/weekly` | Estadísticas semanales |
| GET | `/api/v1/stats/sessions` | Historial de sesiones |
| POST | `/api/v1/stats/sessions` | Registrar sesión |

## Rate Limiting
- 100 requests por minuto por IP

## Tecnologías
- Node.js + Express
- SQLite (base de datos independiente)
- Swagger UI para documentación
