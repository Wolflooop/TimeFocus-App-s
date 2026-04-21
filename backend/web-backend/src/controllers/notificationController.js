const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM recordatorios WHERE id_usuario = ? ORDER BY fecha_hora_envio DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNotification = async (req, res) => {
  const { mensaje, fecha_hora_envio, tipo, id_tarea, id_evento } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO recordatorios (id_usuario, mensaje, fecha_hora_envio, tipo, id_tarea, id_evento) VALUES (?,?,?,?,?,?)',
      [req.user.id, mensaje, fecha_hora_envio, tipo, id_tarea || null, id_evento || null]
    );
    res.status(201).json({ id_recordatorio: result.insertId, mensaje: 'Recordatorio creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE recordatorios SET enviado = 1 WHERE id_recordatorio = ? AND id_usuario = ?', [id, req.user.id]);
    res.json({ mensaje: 'Recordatorio marcado como leído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};