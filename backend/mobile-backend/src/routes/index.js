// src/routes/index.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const aC      = require('../controllers/authController');
const dC      = require('../controllers/dataController');

// ── Auth (público) ────────────────────────────────────────────────
router.post('/auth/login',               aC.login);
router.post('/auth/register',            aC.register);
router.post('/auth/google',              aC.googleSignIn);
router.post('/auth/forgot-password',     aC.forgotPassword);
router.post('/auth/verify-reset-code',   aC.verifyResetCode);
router.post('/auth/reset-password',      aC.resetPassword);
router.get ('/auth/me',          auth,   aC.me);

// ── Catálogos ─────────────────────────────────────────────────────
router.get('/carreras',                  dC.getCarreras);

// ── Tareas ───────────────────────────────────────────────────────
router.get   ('/tasks',          auth,   dC.getTareas);
router.post  ('/tasks',          auth,   dC.createTarea);
router.put   ('/tasks/:id',      auth,   dC.updateTarea);
router.patch ('/tasks/:id',      auth,   dC.updateTarea);
router.delete('/tasks/:id',      auth,   dC.deleteTarea);

// ── Sesiones de estudio (Pomodoro) ────────────────────────────────
router.get ('/sesiones',         auth,   dC.getSesiones);
router.post('/sesiones',         auth,   dC.createSesion);

// ── Horarios ─────────────────────────────────────────────────────
router.get   ('/horarios',       auth,   dC.getHorarios);
router.post  ('/horarios',       auth,   dC.createHorario);
router.delete('/horarios/:id',   auth,   dC.deleteHorario);

// ── Calificaciones ────────────────────────────────────────────────
router.get ('/calificaciones',   auth,   dC.getCalificaciones);
router.post('/calificaciones',   auth,   dC.createCalificacion);

// ── Eventos académicos ────────────────────────────────────────────
router.get   ('/eventos',        auth,   dC.getEventos);
router.post  ('/eventos',        auth,   dC.createEvento);
router.delete('/eventos/:id',    auth,   dC.deleteEvento);

// ── Dashboard / Stats ─────────────────────────────────────────────
router.get('/stats',             auth,   dC.getStats);

// ── Perfil ───────────────────────────────────────────────────────
router.put('/perfil',            auth,   dC.updatePerfil);

// ── Sync offline ─────────────────────────────────────────────────
router.post('/sync',             auth,   dC.syncOffline);

// ── Health check ─────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({
  ok: true, ts: new Date().toISOString(), env: process.env.NODE_ENV || 'dev'
}));

module.exports = router;
