const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middlewares globales ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests/minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Límite: 100 requests/minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Swagger UI ────────────────────────────────────────────────────
const swaggerDoc = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'TimeFocus API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1A2035; }',
}));

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/v1/auth',  require('./src/routes/auth'));
app.use('/api/v1/tasks', require('./src/routes/tasks'));
app.use('/api/v1/stats', require('./src/routes/stats'));

// ── Ruta raíz ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'TimeFocus Public API',
    version: '1.0.0',
    description: 'API pública para desarrolladores externos',
    docs: '/docs',
    endpoints: {
      auth:     '/api/v1/auth',
      tasks:    '/api/v1/tasks',
      stats:    '/api/v1/stats',
      sessions: '/api/v1/stats/sessions',
    },
  });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.path} no encontrada`,
    docs: '/docs',
  });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// ── Servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 TimeFocus Public API corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger: http://localhost:${PORT}/docs\n`);
});
