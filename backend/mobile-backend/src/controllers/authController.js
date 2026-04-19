// src/controllers/authController.js
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool     = require('../config/db');
const mail     = require('../services/mailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) => jwt.sign(
  { id_usuario: user.id_usuario, email: user.email,
    nombre: user.nombre, id_rol: user.id_rol },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const safeUser = (u) => ({
  id_usuario:       u.id_usuario,
  nombre:           u.nombre,
  segundo_nombre:   u.segundo_nombre,
  apellido_paterno: u.apellido_paterno,
  apellido_materno: u.apellido_materno,
  email:            u.email,
  telefono:         u.telefono,
  id_carrera:       u.id_carrera,
  nombre_carrera:   u.nombre_carrera,
  id_rol:           u.id_rol,
  foto_perfil:      u.foto_perfil,
  auth_provider:    u.auth_provider,
});

// ── POST /api/auth/login ──────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });

  const [rows] = await pool.execute(
    `SELECT u.*, c.nombre_carrera FROM usuarios u
     LEFT JOIN carreras c ON c.id_carrera = u.id_carrera
     WHERE u.email = ? AND u.estatus = 1 LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  if (!rows.length) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

  const user = rows[0];
  if (user.auth_provider === 'google')
    return res.status(400).json({ error: 'Esta cuenta usa Google para iniciar sesión' });

  const ok = await bcrypt.compare(password, user.contrasena_hash);
  if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

  return res.json({ token: signToken(user), user: safeUser(user) });
};

// ── POST /api/auth/register ───────────────────────────────────────
exports.register = async (req, res) => {
  const { nombre, segundo_nombre, apellido_paterno, apellido_materno,
          email, password, telefono, id_carrera } = req.body;

  if (!nombre || !apellido_paterno || !email || !password || !id_carrera)
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });

  const [exist] = await pool.execute('SELECT id_usuario FROM usuarios WHERE email=?', [email.toLowerCase()]);
  if (exist.length) return res.status(409).json({ error: 'El correo ya está registrado' });

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    `INSERT INTO usuarios
     (nombre,segundo_nombre,apellido_paterno,apellido_materno,email,contrasena_hash,telefono,id_carrera,id_rol)
     VALUES (?,?,?,?,?,?,?,?,2)`,
    [nombre, segundo_nombre||null, apellido_paterno, apellido_materno||null,
     email.toLowerCase(), hash, telefono||null, id_carrera]
  );
  const id = result.insertId;
  const [rows] = await pool.execute(
    `SELECT u.*, c.nombre_carrera FROM usuarios u
     LEFT JOIN carreras c ON c.id_carrera = u.id_carrera WHERE u.id_usuario=?`, [id]
  );
  const user = rows[0];

  // Enviar bienvenida (no bloqueante)
  mail.sendWelcome(user.email, user.nombre).catch(()=>{});

  return res.status(201).json({ token: signToken(user), user: safeUser(user) });
};

// ── POST /api/auth/google ─────────────────────────────────────────
// El cliente envía el idToken de Google Sign-In
exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken requerido' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Token de Google inválido' });
  }

  const { sub: googleId, email, name, picture, given_name, family_name } = payload;

  // Buscar usuario existente
  let [rows] = await pool.execute(
    `SELECT u.*, c.nombre_carrera FROM usuarios u
     LEFT JOIN carreras c ON c.id_carrera = u.id_carrera
     WHERE u.google_id = ? OR u.email = ? LIMIT 1`,
    [googleId, email]
  );

  let user;
  if (rows.length) {
    user = rows[0];
    // Actualizar google_id y foto si aún no los tenía
    await pool.execute(
      'UPDATE usuarios SET google_id=?, foto_perfil=?, auth_provider="google" WHERE id_usuario=?',
      [googleId, picture, user.id_usuario]
    );
    user.google_id    = googleId;
    user.foto_perfil  = picture;
    user.auth_provider = 'google';
  } else {
    // Crear usuario nuevo — id_carrera 1 como default (se puede cambiar en perfil)
    const [result] = await pool.execute(
      `INSERT INTO usuarios
       (nombre,apellido_paterno,email,contrasena_hash,id_carrera,id_rol,google_id,foto_perfil,auth_provider)
       VALUES (?,?,?,?,1,2,?,?,'google')`,
      [given_name || name, family_name || '', email, await bcrypt.hash(googleId, 8),
       googleId, picture || null]
    );
    const [r] = await pool.execute(
      `SELECT u.*, c.nombre_carrera FROM usuarios u
       LEFT JOIN carreras c ON c.id_carrera = u.id_carrera WHERE u.id_usuario=?`,
      [result.insertId]
    );
    user = r[0];
  }

  return res.json({ token: signToken(user), user: safeUser(user) });
};

// ── POST /api/auth/forgot-password ───────────────────────────────
// Paso 1: pide el correo, genera y envía código de 6 dígitos
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Correo requerido' });

  const [rows] = await pool.execute(
    'SELECT id_usuario, nombre FROM usuarios WHERE email=? AND estatus=1 LIMIT 1',
    [email.toLowerCase()]
  );
  // Siempre responder igual para no revelar si el correo existe
  if (!rows.length) return res.json({ message: 'Si el correo existe, recibirás un código.' });

  const { id_usuario, nombre } = rows[0];
  const code    = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  const expires = new Date(Date.now() + (parseInt(process.env.RESET_CODE_EXPIRES_MIN)||10) * 60000);

  await pool.execute(
    'UPDATE usuarios SET reset_code=?, reset_code_expires=? WHERE id_usuario=?',
    [code, expires, id_usuario]
  );

  try {
    await mail.sendResetCode(email, nombre, code);
  } catch (e) {
    console.error('Mail error:', e.message);
    return res.status(500).json({ error: 'Error al enviar el correo. Revisa la config de Nodemailer.' });
  }

  return res.json({ message: 'Código enviado. Revisa tu correo.' });
};

// ── POST /api/auth/verify-reset-code ─────────────────────────────
// Paso 2: verificar que el código sea correcto
exports.verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Correo y código requeridos' });

  const [rows] = await pool.execute(
    `SELECT id_usuario, reset_code, reset_code_expires
     FROM usuarios WHERE email=? AND estatus=1 LIMIT 1`,
    [email.toLowerCase()]
  );
  if (!rows.length) return res.status(400).json({ error: 'Correo no encontrado' });

  const { reset_code, reset_code_expires } = rows[0];
  if (!reset_code || !reset_code_expires)
    return res.status(400).json({ error: 'No hay una solicitud de recuperación activa' });
  if (new Date() > new Date(reset_code_expires))
    return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
  if (reset_code !== String(code).trim())
    return res.status(400).json({ error: 'Código incorrecto' });

  return res.json({ valid: true, message: 'Código válido. Ahora puedes cambiar tu contraseña.' });
};

// ── POST /api/auth/reset-password ────────────────────────────────
// Paso 3: cambiar la contraseña usando el código verificado
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ error: 'email, code y newPassword son requeridos' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const [rows] = await pool.execute(
    `SELECT id_usuario, reset_code, reset_code_expires
     FROM usuarios WHERE email=? AND estatus=1 LIMIT 1`,
    [email.toLowerCase()]
  );
  if (!rows.length) return res.status(400).json({ error: 'Correo no encontrado' });

  const { id_usuario, reset_code, reset_code_expires } = rows[0];
  if (!reset_code || new Date() > new Date(reset_code_expires))
    return res.status(400).json({ error: 'El código ha expirado' });
  if (reset_code !== String(code).trim())
    return res.status(400).json({ error: 'Código incorrecto' });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.execute(
    'UPDATE usuarios SET contrasena_hash=?, reset_code=NULL, reset_code_expires=NULL WHERE id_usuario=?',
    [hash, id_usuario]
  );

  return res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
};

// ── GET /api/auth/me ──────────────────────────────────────────────
exports.me = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.*, c.nombre_carrera FROM usuarios u
     LEFT JOIN carreras c ON c.id_carrera = u.id_carrera
     WHERE u.id_usuario=? AND u.estatus=1 LIMIT 1`,
    [req.user.id_usuario]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json({ user: safeUser(rows[0]) });
};
