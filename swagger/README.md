# TimeFocus Public API — Documentación

API pública de TimeFocus para desarrolladores externos.

---

## Acceso rápido

[![Ver Documentación Swagger](https://img.shields.io/badge/Swagger-Documentación%20Interactiva-38bdf8?style=for-the-badge&logo=swagger&logoColor=white)](https://wolflooop.github.io/TimeFocus-App-s/swagger/)

[![API en Producción](https://img.shields.io/badge/API-Live%20en%20Render-4ade80?style=for-the-badge&logo=render&logoColor=white)](https://timefocus-app-s.onrender.com/docs)

---

## Endpoints

| Método | Cantidad |
|--------|----------|
| `GET` | 6 |
| `POST` | 5 |
| `PUT` | 1 |
| `DELETE` | 2 |

## Autenticación

Todas las rutas excepto `/auth/register` y `/auth/login` requieren el header:

\`\`\`
X-API-Key: tf_live_xxxxEME9M9cSy9FvfHvcx2gMPkp1H5Dj4YaKufPRsAyon8Tf
\`\`\`

## Empezar

1. Regístrate en `POST /auth/register`
2. Guarda tu API Key (solo se muestra una vez)
3. Úsala en el header `X-API-Key` en todas tus peticiones

## Rate Limiting

100 requests por minuto por API Key.
