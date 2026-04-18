const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.contrasena_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign(
      { id: user.id_usuario, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id_usuario, nombre: user.nombre, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { nombre, apellido_paterno, email, password, id_carrera } = req.body;
  try {
    const [exists] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ error: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido_paterno, email, contrasena_hash, id_carrera) VALUES (?,?,?,?,?)',
      [nombre, apellido_paterno, email, hash, id_carrera || 1]
    );
    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.insertId, nombre, email } });
  } catch (err) {
    console.error('ERROR REGISTER:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, apellido_paterno, email FROM usuarios WHERE id_usuario = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
