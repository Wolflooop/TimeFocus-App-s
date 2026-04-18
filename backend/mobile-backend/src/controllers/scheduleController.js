const pool = require('../config/db');

exports.getSchedule = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM horarios WHERE id_usuario = ? AND activo = 1 ORDER BY dia_semana, hora_inicio',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSchedule = async (req, res) => {
  const { materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO horarios (id_usuario, materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente]
    );
    res.status(201).json({ id_horario: result.insertId, mensaje: 'Horario creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE horarios SET activo = 0 WHERE id_horario = ? AND id_usuario = ?', [id, req.user.id]);
    res.json({ mensaje: 'Horario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};