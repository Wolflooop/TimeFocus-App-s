const db = require('../config/db');

// GET /api/sesiones
const listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_sesiones_semana WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
};

// POST /api/sesiones
const crear = async (req, res) => {
  try {
    const { fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia } = req.body;

    if (!fecha || !hora_inicio || !hora_fin || !duracion_minutos) {
      return res.status(400).json({ error: 'Fecha, hora inicio, hora fin y duración son requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO sesiones_estudio (id_usuario, fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, fecha, hora_inicio, hora_fin, duracion_minutos, tipo || 'estudio', materia || null]
    );

    res.status(201).json({ mensaje: 'Sesión registrada', id_sesion: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear sesión' });
  }
};

module.exports = { listar, crear };
