require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/tareas',   require('./src/routes/tareas'));
app.use('/api/sesiones', require('./src/routes/sesiones'));
app.use('/api/horarios', require('./src/routes/horarios'));
app.use('/api/stats',    require('./src/routes/stats'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', proyecto: 'TimeFocus Web Backend', version: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ TimeFocus Web Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/auth/registro`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/perfil`);
  console.log(`   GET  /api/tareas`);
  console.log(`   POST /api/tareas`);
  console.log(`   PUT  /api/tareas/:id`);
  console.log(`   DELETE /api/tareas/:id`);
  console.log(`   GET  /api/sesiones`);
  console.log(`   POST /api/sesiones`);
  console.log(`   GET  /api/horarios`);
  console.log(`   POST /api/horarios`);
  console.log(`   GET  /api/stats/resumen`);
  console.log(`   GET  /api/stats/calificaciones`);
  console.log(`   GET  /api/stats/tareas-vencidas`);
});
