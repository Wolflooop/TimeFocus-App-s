const db = require('../config/db');

// GET /api/tareas
const listar = async (req, res) => {
  try {
    const { estado, prioridad } = req.query;
    let query = 'SELECT * FROM vw_tareas_detalle WHERE id_tarea IN (SELECT id_tarea FROM tareas WHERE id_usuario = ?)';
    const params = [req.usuario.id_usuario];

    if (estado)    { query += ' AND estado = ?';    params.push(estado); }
    if (prioridad) { query += ' AND prioridad = ?'; params.push(prioridad); }

    query += ' ORDER BY fecha_limite ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

// GET /api/tareas/:id
const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tareas WHERE id_tarea = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
};

// POST /api/tareas
const crear = async (req, res) => {
  try {
    const { titulo, descripcion, fecha_limite, hora_limite, prioridad, materia } = req.body;

    if (!titulo || !fecha_limite) {
      return res.status(400).json({ error: 'Título y fecha límite son requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO tareas (id_usuario, titulo, descripcion, fecha_limite, hora_limite, prioridad, materia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, titulo, descripcion || null, fecha_limite, hora_limite || null, prioridad || 'media', materia || null]
    );

    res.status(201).json({ mensaje: 'Tarea creada', id_tarea: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

// PUT /api/tareas/:id
const actualizar = async (req, res) => {
  try {
    const { titulo, descripcion, fecha_limite, hora_limite, prioridad, estado, materia } = req.body;

    const [existe] = await db.query(
      'SELECT id_tarea, estado FROM tareas WHERE id_tarea = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (existe.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });

    await db.query(
      `UPDATE tareas SET titulo=?, descripcion=?, fecha_limite=?, hora_limite=?, prioridad=?, estado=?, materia=?
       WHERE id_tarea = ? AND id_usuario = ?`,
      [titulo, descripcion || null, fecha_limite, hora_limite || null, prioridad, estado, materia || null,
       req.params.id, req.usuario.id_usuario]
    );

    // Auditoría
    if (estado && estado !== existe[0].estado) {
      await db.query(
        `INSERT INTO auditoria_tareas (id_tarea, id_usuario, accion, estado_prev, estado_nuevo)
         VALUES (?, ?, 'actualizar', ?, ?)`,
        [req.params.id, req.usuario.id_usuario, existe[0].estado, estado]
      );
    }

    res.json({ mensaje: 'Tarea actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

// DELETE /api/tareas/:id
const eliminar = async (req, res) => {
  try {
    const [existe] = await db.query(
      'SELECT id_tarea FROM tareas WHERE id_tarea = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (existe.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });

    await db.query('DELETE FROM tareas WHERE id_tarea = ?', [req.params.id]);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
