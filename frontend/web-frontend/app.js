const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'src/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── HELPER: fecha actual en español
const fechaHoy = () => {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

// ── ONBOARDING
app.get('/', (req, res) => res.render('onboarding/splash'));

app.get('/intro/:step', (req, res) => {
  const steps = [
    { index: 0, titulo: 'Organiza tu tiempo de estudio',     descripcion: 'Conecta tus materias, tareas y sesiones de estudio en un solo lugar con inteligencia.',             siguiente: '/intro/1' },
    { index: 1, titulo: 'Técnica Pomodoro inteligente',      descripcion: 'Sesiones de 25 min, descansos automáticos y estadísticas de productividad en tiempo real.',         siguiente: '/intro/2' },
    { index: 2, titulo: 'Monitorea tus hábitos digitales',   descripcion: 'Analiza correlaciones entre tiempo en pantalla y tus calificaciones para tomar mejores decisiones.', siguiente: '/login' },
  ];
  const step = steps[parseInt(req.params.step)] || steps[0];
  res.render('onboarding/intro', { slide: step });
});

app.get('/login', (req, res) => res.render('onboarding/login'));

// ── REGISTRO
app.get('/registro', (req, res) => res.render('onboarding/registro'));
app.post('/registro', (req, res) => {
  console.log('Nuevo registro:', req.body);
  res.redirect('/dashboard');
});

// ── DASHBOARD
app.get('/dashboard', (req, res) => {
  res.render('dashboard/index', {
    title: 'Inicio',
    currentPage: 'inicio',
    fecha: fechaHoy(),
  });
});

// ── TEMAS
app.get('/temas', (req, res) => {
  res.render('temas/index', { title: 'Temas', currentPage: 'temas' });
});
app.get('/temas/nueva', (req, res) => {
  res.render('temas/nueva', { title: 'Nuevo Tema', currentPage: 'temas' });
});
app.post('/temas', (req, res) => {
  console.log('Nuevo tema:', req.body);
  res.redirect('/temas');
});

// ── TAREAS
app.get('/tareas', (req, res) => {
  res.render('tareas/index', { title: 'Tareas', currentPage: 'tareas' });
});
app.get('/tareas/nueva', (req, res) => {
  res.render('tareas/nueva', { title: 'Nueva tarea', currentPage: 'tareas' });
});
app.post('/tareas', (req, res) => {
  console.log('Nueva tarea:', req.body);
  res.redirect('/tareas');
});

// ── TIMER
app.get('/timer', (req, res) => {
  res.render('timer/index', { title: 'Temporizador', currentPage: 'timer' });
});

// ── ESTADÍSTICAS
app.get('/estadisticas', (req, res) => {
  res.render('estadisticas/index', { title: 'Estadísticas', currentPage: 'estadisticas' });
});

// ── PERFIL
app.get('/perfil', (req, res) => {
  res.render('perfil/index', { title: 'Perfil', currentPage: 'perfil' });
});
app.get('/perfil/info', (req, res) => {
  res.render('perfil/index', { title: 'Mi información', currentPage: 'perfil' });
});
app.get('/perfil/metas', (req, res) => {
  res.render('perfil/index', { title: 'Metas de estudio', currentPage: 'perfil' });
});
app.get('/perfil/notificaciones', (req, res) => {
  res.render('perfil/index', { title: 'Notificaciones', currentPage: 'perfil' });
});
app.get('/perfil/privacidad', (req, res) => {
  res.render('perfil/index', { title: 'Privacidad de datos', currentPage: 'perfil' });
});

// ── LOGOUT
app.get('/logout', (req, res) => res.redirect('/'));

// ── 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

app.listen(PORT, () => {
  console.log(`✅ TimeFocus corriendo en http://localhost:${PORT}`);
});
