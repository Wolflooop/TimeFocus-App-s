// src/index.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const routes     = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;
const IP   = process.env.SERVER_IP || '0.0.0.0';

// ── Middlewares ───────────────────────────────────────────────────
app.use(cors({ origin: '*' }));   // En producción limita al dominio de la app
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting: máx 100 requests por 15 min por IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Intenta en unos minutos.' },
}));

// Rate limiting más estricto para auth
app.use('/api/auth', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de autenticación. Espera 10 minutos.' },
}));

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api', routes);
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/notifications', require('./routes/notifications'));

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));

// ── Error handler global ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Iniciar servidor ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n TimeFocus API iniciada');
  console.log(`   Local:   http://localhost:${PORT}/api`);
  console.log(`   Red:     http://${IP}:${PORT}/api`);
  console.log(`   Health:  http://${IP}:${PORT}/api/health\n`);
});

module.exports = app;