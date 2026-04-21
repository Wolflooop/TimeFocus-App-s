// index.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          require('./src/routes/auth'));
app.use('/api/tasks',         require('./src/routes/tasks'));
app.use('/api/sessions',      require('./src/routes/sessions'));
app.use('/api/schedule',      require('./src/routes/schedule'));
app.use('/api/notifications', require('./src/routes/notifications'));

// Health check
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
