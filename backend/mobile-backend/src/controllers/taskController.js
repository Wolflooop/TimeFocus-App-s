const pool = require('../config/db');

exports.getTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tareas WHERE id_usuario = ? ORDER BY fecha_limite ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  const { titulo, descripcion, fecha_limite, prioridad, materia } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tareas (id_usuario, titulo, descripcion, fecha_limite, prioridad, materia) VALUES (?,?,?,?,?,?)',
      [req.user.id, titulo, descripcion, fecha_limite, prioridad || 'media', materia]
    );
    res.status(201).json({ id_tarea: result.insertId, mensaje: 'Tarea creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { estado, titulo, descripcion, fecha_limite, prioridad } = req.body;
  try {
    await pool.query(
      'UPDATE tareas SET estado=?, titulo=?, descripcion=?, fecha_limite=?, prioridad=? WHERE id_tarea=? AND id_usuario=?',
      [estado, titulo, descripcion, fecha_limite, prioridad, id, req.user.id]
    );
    res.json({ mensaje: 'Tarea actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tareas WHERE id_tarea=? AND id_usuario=?', [id, req.user.id]);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};