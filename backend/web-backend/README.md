# TimeFocus Web Backend

API REST para el frontend web de TimeFocus.

## Instalación
```bash
npm install
cp .env.example .env
# Configura tus credenciales en .env
node src/config/initDB.js  # Inicializar BD
npm run dev
```

## Endpoints
- POST /api/auth/login
- POST /api/auth/register
- GET  /api/tasks
- POST /api/tasks
- PUT  /api/tasks/:id
- DELETE /api/tasks/:id
- GET  /api/sessions
- GET  /api/schedule
- GET  /api/notifications
