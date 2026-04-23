// app.js — TimeFocus Web Frontend
require('dotenv').config();
const express = require('express');
const path    = require('path');
const session = require('express-session');
const axios   = require('axios');

const app     = express();
const PORT    = process.env.PORT    || 3001;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret:            process.env.SESSION_SECRET || 'timefocus_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

const fechaHoy = () => new Date().toLocaleDateString('es-MX', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

const apiGet  = (url, token) =>
  axios.get(`${API_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } });
const apiPost = (url, data, token) =>
  axios.post(`${API_URL}${url}`, data, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
const apiPut  = (url, data, token) =>
  axios.put(`${API_URL}${url}`, data, { headers: { Authorization: `Bearer ${token}` } });
const apiDel  = (url, token) =>
  axios.delete(`${API_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } });

// Evita que el navegador cachee páginas protegidas
const noCache = (res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

const authWeb = (req, res, next) => {
  noCache(res);
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
    { index: 0, titulo: 'Organiza tu tiempo de estudio',   descripcion: 'Conecta tus materias, tareas y sesiones de estudio en un solo lugar.',       siguiente: '/intro/1' },
    { index: 1, titulo: 'Técnica Pomodoro inteligente',    descripcion: 'Sesiones de 25 min, descansos automáticos y estadísticas en tiempo real.',    siguiente: '/intro/2' },
    { index: 2, titulo: 'Monitorea tus hábitos digitales', descripcion: 'Analiza correlaciones entre tiempo en pantalla y tus calificaciones.',        siguiente: '/login' },
  ];
  const step = steps[parseInt(req.params.step)] || steps[0];
  res.render('onboarding/intro', { slide: step });
});

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
app.get('/login', (req, res) => {
  noCache(res);
  if (req.session?.token) return res.redirect('/dashboard');
  res.render('onboarding/login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim()) return res.render('onboarding/login', { error: 'Ingresa tu correo electrónico' });
  if (!password)      return res.render('onboarding/login', { error: 'Ingresa tu contraseña' });
  try {
    const { data } = await apiPost('/auth/login', { email: email.trim(), password });
    // Regenerar ID de sesión para evitar session fixation
    req.session.regenerate((err) => {
      if (err) return res.render('onboarding/login', { error: 'Error de sesión. Intenta de nuevo.' });
      req.session.token = data.token;
      req.session.user  = data.user;
      req.session.save(() => res.redirect('/dashboard'));
    });
  } catch (err) {
    const msg = err.response?.data?.error || 'Correo o contraseña incorrectos';
    res.render('onboarding/login', { error: msg });
  }
});

app.get('/registro', (req, res) => {
  noCache(res);
  if (req.session?.token) return res.redirect('/dashboard');
  res.render('onboarding/registro', { error: null });
});

app.post('/registro', async (req, res) => {
  const { nombre, apellido_paterno, email, password } = req.body;
  if (!nombre?.trim())           return res.render('onboarding/registro', { error: 'El nombre es obligatorio' });
  if (!apellido_paterno?.trim()) return res.render('onboarding/registro', { error: 'El apellido es obligatorio' });
  if (!email?.trim())            return res.render('onboarding/registro', { error: 'El correo es obligatorio' });
  if (!password || password.length < 6)
    return res.render('onboarding/registro', { error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const { data } = await apiPost('/auth/register', {
      nombre: nombre.trim(), apellido_paterno: apellido_paterno.trim(),
      email: email.trim(), password, id_carrera: 1,
    });
    req.session.regenerate((err) => {
      if (err) return res.render('onboarding/registro', { error: 'Error de sesión. Intenta de nuevo.' });
      req.session.token = data.token;
      req.session.user  = data.user;
      req.session.save(() => res.redirect('/dashboard'));
    });
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al registrarse. Intenta de nuevo.';
    res.render('onboarding/registro', { error: msg });
  }
});

app.get('/logout', (req, res) => {
  const cookieName = req.app.get('trust proxy') ? '__Secure-connect.sid' : 'connect.sid';
  req.session.destroy((err) => {
    // Limpiar cookie de sesión explícitamente
    res.clearCookie(cookieName);
    res.clearCookie('connect.sid');
    // Prevenir que el navegador muestre páginas cacheadas post-logout
    noCache(res);
    res.redirect('/login');
  });
});

// ══════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════
app.get('/dashboard', authWeb, async (req, res) => {
  try {
    const [{ data: tareas }, { data: stats }] = await Promise.all([
      apiGet('/tasks', req.session.token),
      apiGet('/sessions/stats', req.session.token),
    ]);
    const pendientes = tareas.filter(t => t.estado !== 'completada').length;
    res.render('dashboard/index', {
      title: 'Inicio', currentPage: 'inicio',
      fecha: fechaHoy(), user: req.session.user,
      tareas: tareas.slice(0, 4), totalTareas: tareas.length,
      pendientes, stats,
    });
  } catch {
    res.render('dashboard/index', {
      title: 'Inicio', currentPage: 'inicio',
      fecha: fechaHoy(), user: req.session.user,
      tareas: [], totalTareas: 0, pendientes: 0, stats: null,
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// TAREAS
// ══════════════════════════════════════════════════════════════════
app.get('/tareas', authWeb, async (req, res) => {
  try {
    const { data: todas } = await apiGet('/tasks', req.session.token);
    const filtro = req.query.filtro || 'todas';
    const tareas = filtro === 'todas' ? todas : todas.filter(t => t.estado === filtro);
    res.render('tareas/index', { title: 'Tareas', currentPage: 'tareas', tareas, filtro });
  } catch {
    res.render('tareas/index', { title: 'Tareas', currentPage: 'tareas', tareas: [], filtro: 'todas' });
  }
});

app.get('/tareas/nueva', authWeb, (req, res) => {
  res.render('tareas/nueva', { title: 'Nueva Tarea', currentPage: 'tareas', error: null });
});

app.post('/tareas', authWeb, async (req, res) => {
  const { titulo, materia, fecha_limite, prioridad, estado, notas } = req.body;
  if (!titulo?.trim())
    return res.render('tareas/nueva', { title: 'Nueva Tarea', currentPage: 'tareas', error: 'El título es obligatorio' });
  try {
    await apiPost('/tasks', {
      titulo:       titulo.trim(),
      descripcion:  notas        || null,
      fecha_limite: fecha_limite || null,
      prioridad:    prioridad    || 'media',
      materia:      materia      || null,
      estado:       estado       || 'pendiente',
    }, req.session.token);
    res.redirect('/tareas');
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al crear la tarea';
    res.render('tareas/nueva', { title: 'Nueva Tarea', currentPage: 'tareas', error: msg });
  }
});

app.post('/tareas/:id/estado', authWeb, async (req, res) => {
  try {
    await apiPut(`/tasks/${req.params.id}`, { estado: req.body.estado }, req.session.token);
  } catch {}
  const back = req.headers.referer || '/tareas';
  res.redirect(back);
});

app.post('/tareas/:id/eliminar', authWeb, async (req, res) => {
  try { await apiDel(`/tasks/${req.params.id}`, req.session.token); } catch {}
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
app.get('/timer', authWeb, async (req, res) => {
  try {
    const { data: tareas } = await apiGet('/tasks', req.session.token);
    const activas = tareas.filter(t => t.estado !== 'completada');
    res.render('timer/index', { title: 'Temporizador', currentPage: 'timer', tareas: activas });
  } catch {
    res.render('timer/index', { title: 'Temporizador', currentPage: 'timer', tareas: [] });
  }
});

app.post('/timer/sesion', authWeb, async (req, res) => {
  try {
    await apiPost('/sessions', req.body, req.session.token);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════
app.get('/estadisticas', authWeb, async (req, res) => {
  try {
    const [{ data: sesiones }, { data: stats }] = await Promise.all([
      apiGet('/sessions', req.session.token),
      apiGet('/sessions/stats', req.session.token),
    ]);
    res.render('estadisticas/index', {
      title: 'Estadísticas', currentPage: 'estadisticas', sesiones, stats,
    });
  } catch {
    res.render('estadisticas/index', {
      title: 'Estadísticas', currentPage: 'estadisticas', sesiones: [], stats: null,
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// PERFIL
// ══════════════════════════════════════════════════════════════════
app.get('/perfil', authWeb, (req, res) => {
  res.render('perfil/index', { title: 'Perfil', currentPage: 'perfil', user: req.session.user });
});

app.get('/perfil/info', authWeb, (req, res) => {
  res.render('perfil/info', { title: 'Mi Información', currentPage: 'perfil', user: req.session.user });
});

app.post('/perfil/info', authWeb, (req, res) => {
  req.session.user = { ...req.session.user, ...req.body };
  res.redirect('/perfil');
});

app.get('/perfil/metas',          authWeb, (req, res) => res.render('perfil/metas',          { title: 'Metas de Estudio', currentPage: 'perfil' }));
app.get('/perfil/notificaciones', authWeb, (req, res) => res.render('perfil/notificaciones', { title: 'Notificaciones',   currentPage: 'perfil' }));
app.get('/perfil/privacidad',     authWeb, (req, res) => res.render('perfil/privacidad',     { title: 'Privacidad',       currentPage: 'perfil' }));

// 404
app.use((req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () => {
  console.log(`✅ TimeFocus Web corriendo en http://localhost:${PORT}`);
});
