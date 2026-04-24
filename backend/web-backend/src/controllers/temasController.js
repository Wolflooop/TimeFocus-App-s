const db = require('../config/db');
 
// GET /api/temas
const listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM temas WHERE id_usuario = ? ORDER BY nombre ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener temas' });
  }
};
 
// GET /api/temas/:id
const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM temas WHERE id_tema = ? AND id_usuario = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tema' });
  }
};
 
// POST /api/temas
const crear = async (req, res) => {
  try {
    const { nombre, profesor, color, num_tareas } = req.body;
 
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del tema es obligatorio' });
    }
 
    const [result] = await db.query(
      `INSERT INTO temas (id_usuario, nombre, profesor, color, num_tareas)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        nombre.trim(),
        profesor?.trim() || null,
        color || '#1976d2',
        num_tareas || 0,
      ]
    );
 
    res.status(201).json({ mensaje: 'Tema creado', id_tema: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tema' });
  }
};
 
// PUT /api/temas/:id
const actualizar = async (req, res) => {
  try {
    const { nombre, profesor, color, num_tareas } = req.body;
    const [existing] = await db.query(
      'SELECT * FROM temas WHERE id_tema = ? AND id_usuario = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Tema no encontrado' });
 
    const t = existing[0];
    await db.query(
      `UPDATE temas SET nombre = ?, profesor = ?, color = ?, num_tareas = ?
       WHERE id_tema = ? AND id_usuario = ?`,
      [
        nombre?.trim() ?? t.nombre,
        profesor?.trim() ?? t.profesor,
        color ?? t.color,
        num_tareas ?? t.num_tareas,
        req.params.id,
        req.user.id,
      ]
    );
 
    res.json({ mensaje: 'Tema actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tema' });
  }
};
 
// DELETE /api/temas/:id
const eliminar = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM temas WHERE id_tema = ? AND id_usuario = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json({ mensaje: 'Tema eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tema' });
  }
};
 
module.exports = { listar, obtener, crear, actualizar, eliminar };