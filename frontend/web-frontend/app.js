// app.js — TimeFocus Web Frontend
// Conectado al backend via API REST con sesiones de servidor
require('dotenv').config();
const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const axios    = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

// URL del backend (configura en .env)
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// ── Motor de vistas ───────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ── Middlewares ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret:            process.env.SESSION_SECRET || 'timefocus_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// ── Helper: fecha en español ──────────────────────────────────────
const fechaHoy = () => new Date().toLocaleDateString('es-MX', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

// ── Helper: llamadas al API con token ────────────────────────────
const apiGet  = (url, token) => axios.get(`${API_URL}${url}`,   { headers: { Authorization: `Bearer ${token}` } });
const apiPost = (url, data, token) => axios.post(`${API_URL}${url}`, data, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
const apiPut  = (url, data, token) => axios.put(`${API_URL}${url}`,  data, { headers: { Authorization: `Bearer ${token}` } });
const apiDel  = (url, token) => axios.delete(`${API_URL}${url}`,     { headers: { Authorization: `Bearer ${token}` } });

// ── Middleware auth web ───────────────────────────────────────────
const authWeb = (req, res, next) => {
  if (!req.session?.token) return res.redirect('/login');
  next();
};

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  if (req.session?.token) return res.redirect('/dashboard');
  res.render('onboarding/splash');
});

app.get('/intro/:step', (req, res) => {
  const steps = [
    { index: 0, titulo: 'Organiza tu tiempo de estudio',     descripcion: 'Conecta tus materias, tareas y sesiones de estudio en un solo lugar.',         siguiente: '/intro/1' },
    { index: 1, titulo: 'Técnica Pomodoro inteligente',      descripcion: 'Sesiones de 25 min, descansos automáticos y estadísticas en tiempo real.',      siguiente: '/intro/2' },
    { index: 2, titulo: 'Monitorea tus hábitos digitales',   descripcion: 'Analiza correlaciones entre tiempo en pantalla y tus calificaciones.',          siguiente: '/login' },
  ];
  const step = steps[parseInt(req.params.step)] || steps[0];
  res.render('onboarding/intro', { slide: step });
});

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
app.get('/login', (req, res) => {
  if (req.session?.token) return res.redirect('/dashboard');
  res.render('onboarding/login', { error: req.query.error });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data } = await apiPost('/auth/login', { email, password });
    req.session.token = data.token;
    req.session.user  = data.user;
    res.redirect('/dashboard');
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al iniciar sesión';
    res.render('onboarding/login', { error: msg });
  }
});

app.get('/registro', (req, res) => {
  if (req.session?.token) return res.redirect('/dashboard');
  res.render('onboarding/registro', { error: req.query.error });
});

app.post('/registro', async (req, res) => {
  const { nombre, apellido_paterno, email, password } = req.body;
  try {
    const { data } = await apiPost('/auth/register', {
      nombre, apellido_paterno, email, password, id_carrera: 1
    });
    req.session.token = data.token;
    req.session.user  = data.user;
    res.redirect('/dashboard');
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al registrarse';
    res.render('onboarding/registro', { error: msg });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ══════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════
app.get('/dashboard', authWeb, async (req, res) => {
  try {
    const { data: tareas } = await apiGet('/tasks', req.session.token);
    const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
    res.render('dashboard/index', {
      title:       'Inicio',
      currentPage: 'inicio',
      fecha:       fechaHoy(),
      user:        req.session.user,
      tareas:      tareas.slice(0, 3),
      totalTareas: tareas.length,
      pendientes,
    });
  } catch {
    res.render('dashboard/index', {
      title: 'Inicio', currentPage: 'inicio',
      fecha: fechaHoy(), user: req.session.user,
      tareas: [], totalTareas: 0, pendientes: 0,
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// TAREAS
// ══════════════════════════════════════════════════════════════════
app.get('/tareas', authWeb, async (req, res) => {
  try {
    const { data: tareas } = await apiGet('/tasks', req.session.token);
    res.render('tareas/index', { title: 'Tareas', currentPage: 'tareas', tareas });
  } catch {
    res.render('tareas/index', { title: 'Tareas', currentPage: 'tareas', tareas: [] });
  }
});

app.get('/tareas/nueva', authWeb, (req, res) => {
  res.render('tareas/nueva', { title: 'Nueva Tarea', currentPage: 'tareas' });
});

app.post('/tareas', authWeb, async (req, res) => {
  try {
    await apiPost('/tasks', req.body, req.session.token);
    res.redirect('/tareas');
  } catch {
    res.redirect('/tareas');
  }
});

app.post('/tareas/:id/eliminar', authWeb, async (req, res) => {
  try {
    await apiDel(`/tasks/${req.params.id}`, req.session.token);
  } catch {}
  res.redirect('/tareas');
});

// ══════════════════════════════════════════════════════════════════
// TEMAS
// ══════════════════════════════════════════════════════════════════
app.get('/temas',       authWeb, (req, res) => res.render('temas/index', { title: 'Temas',      currentPage: 'temas' }));
app.get('/temas/nueva', authWeb, (req, res) => res.render('temas/nueva', { title: 'Nuevo Tema', currentPage: 'temas' }));
app.post('/temas',      authWeb, (req, res) => res.redirect('/temas'));

// ══════════════════════════════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════════════════════════════
app.get('/timer', authWeb, (req, res) => {
  res.render('timer/index', { title: 'Temporizador', currentPage: 'timer' });
});

// ══════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════
app.get('/estadisticas', authWeb, async (req, res) => {
  try {
    const { data: sesiones } = await apiGet('/sessions', req.session.token);
    res.render('estadisticas/index', {
      title: 'Estadísticas', currentPage: 'estadisticas', sesiones
    });
  } catch {
    res.render('estadisticas/index', {
      title: 'Estadísticas', currentPage: 'estadisticas', sesiones: []
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// PERFIL
// ══════════════════════════════════════════════════════════════════
app.get('/perfil', authWeb, (req, res) => {
  res.render('perfil/index', { title: 'Perfil', currentPage: 'perfil', user: req.session.user });
});
app.get('/perfil/info',           authWeb, (req, res) => res.render('perfil/info',           { title: 'Mi Información',    currentPage: 'perfil', user: req.session.user }));
app.get('/perfil/metas',          authWeb, (req, res) => res.render('perfil/metas',          { title: 'Metas de Estudio',  currentPage: 'perfil' }));
app.get('/perfil/notificaciones', authWeb, (req, res) => res.render('perfil/notificaciones', { title: 'Notificaciones',    currentPage: 'perfil' }));
app.get('/perfil/privacidad',     authWeb, (req, res) => res.render('perfil/privacidad',     { title: 'Privacidad',        currentPage: 'perfil' }));

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () => {
  console.log(`✅ TimeFocus Web corriendo en http://localhost:${PORT}`);
});
