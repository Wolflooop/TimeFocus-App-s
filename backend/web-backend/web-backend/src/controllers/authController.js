const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// POST /api/auth/registro
const registro = async (req, res) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, email, contrasena, id_carrera } = req.body;

    if (!nombre || !apellido_paterno || !email || !contrasena || !id_carrera) {
      return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
    }

    const [existe] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, contrasena_hash, id_carrera, id_rol)
       VALUES (?, ?, ?, ?, ?, ?, 2)`,
      [nombre, apellido_paterno, apellido_materno || null, email, hash, id_carrera]
    );

    res.status(201).json({ mensaje: 'Usuario registrado correctamente', id_usuario: result.insertId });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const [rows] = await db.query(
      `SELECT u.*, r.nombre_rol, c.nombre_carrera
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       JOIN carreras c ON u.id_carrera = c.id_carrera
       WHERE u.email = ? AND u.estatus = 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];
    const valido  = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!valido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.nombre_rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id_usuario:     usuario.id_usuario,
        nombre:         usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        email:          usuario.email,
        rol:            usuario.nombre_rol,
        carrera:        usuario.nombre_carrera
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/perfil
const perfil = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.segundo_nombre, u.apellido_paterno, u.apellido_materno,
              u.email, u.telefono, u.fecha_registro,
              r.nombre_rol, c.nombre_carrera
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       JOIN carreras c ON u.id_carrera = c.id_carrera
       WHERE u.id_usuario = ?`,
      [req.usuario.id_usuario]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error en perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { registro, login, perfil };
