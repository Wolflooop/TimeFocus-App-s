const db = require('../config/db');

// GET /api/horarios
const listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM horarios WHERE id_usuario = ? AND activo = 1 ORDER BY dia_semana, hora_inicio`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};

// POST /api/horarios
const crear = async (req, res) => {
  try {
    const { materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente, ap_paterno_doc, ap_materno_doc } = req.body;

    if (!materia || !dia_semana || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Materia, día, hora inicio y hora fin son requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO horarios (id_usuario, materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente, ap_paterno_doc, ap_materno_doc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, materia, dia_semana, hora_inicio, hora_fin,
       aula || null, nombre_docente || null, ap_paterno_doc || null, ap_materno_doc || null]
    );

    res.status(201).json({ mensaje: 'Horario creado', id_horario: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

// DELETE /api/horarios/:id
const eliminar = async (req, res) => {
  try {
    await db.query(
      'UPDATE horarios SET activo = 0 WHERE id_horario = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensaje: 'Horario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
};

module.exports = { listar, crear, eliminar };
