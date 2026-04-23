// src/controllers/taskController.js
const pool = require('../config/db');

// Los estados válidos según la BD
// enum: pendiente, en_progreso, en_curso, completada
// (en_curso se agregó para compatibilidad con el frontend)

exports.getTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tareas WHERE id_usuario = ? ORDER BY fecha_limite ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTask = async (req, res) => {
  const { titulo, descripcion, fecha_limite, prioridad, materia, estado } = req.body;
  if (!titulo || !titulo.trim())
    return res.status(400).json({ error: 'El título es obligatorio' });
  try {
    const [result] = await pool.query(
      `INSERT INTO tareas
         (id_usuario, titulo, descripcion, fecha_limite, prioridad, materia, estado)
       VALUES (?,?,?,?,?,?,?)`,
      [
        req.user.id,
        titulo.trim(),
        descripcion || null,
        fecha_limite || null,
        prioridad   || 'media',
        materia     || null,
        estado      || 'pendiente',
      ]
    );
    res.status(201).json({ id_tarea: result.insertId, mensaje: 'Tarea creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT — solo actualiza los campos que vienen, no sobreescribe los demás
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { estado, titulo, descripcion, fecha_limite, prioridad } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tareas WHERE id_tarea=? AND id_usuario=? LIMIT 1',
      [id, req.user.id]
    );
    if (!existing.length)
      return res.status(404).json({ error: 'Tarea no encontrada' });

    const t = existing[0];
    await pool.query(
      `UPDATE tareas
       SET estado       = ?,
           titulo       = ?,
           descripcion  = ?,
           fecha_limite = ?,
           prioridad    = ?
       WHERE id_tarea=? AND id_usuario=?`,
      [
        estado       ?? t.estado,
        titulo       ?? t.titulo,
        descripcion  !== undefined ? descripcion  : t.descripcion,
        fecha_limite !== undefined ? fecha_limite : t.fecha_limite,
        prioridad    ?? t.prioridad,
        id,
        req.user.id,
      ]
    );
    res.json({ mensaje: 'Tarea actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM tareas WHERE id_tarea=? AND id_usuario=?',
      [id, req.user.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
