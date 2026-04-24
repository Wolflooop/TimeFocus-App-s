// index.js
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');

const app = express();

// ── SEGURIDAD: Headers HTTP seguros ─────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // desactivado para permitir inline scripts del frontend
}));

// ── SEGURIDAD: CORS solo al frontend ────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── SEGURIDAD: Rate limit en auth (max 20 intentos / 15 min) ────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authLimiter, require('./src/routes/auth'));
app.use('/api/tasks',         require('./src/routes/tasks'));
app.use('/api/temas',         require('./src/routes/temas'));
app.use('/api/sessions',      require('./src/routes/sessions'));
app.use('/api/schedule',      require('./src/routes/schedule'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/account',       require('./src/routes/account'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date() }));
app.get('/', (req, res) => res.json({ mensaje: 'TimeFocus API corriendo ✅' }));

app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍅 TimeFocus API en puerto ${PORT}`);
  console.log(`   http://localhost:${PORT}/api/health\n`);
});
 