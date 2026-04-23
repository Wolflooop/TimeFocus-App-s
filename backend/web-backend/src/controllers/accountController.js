// src/controllers/accountController.js
const pool = require('../config/db');

// DELETE /api/account/sessions — borra historial de sesiones del usuario
exports.clearHistory = async (req, res) => {
  try {
    await pool.query('DELETE FROM sesiones_estudio WHERE id_usuario = ?', [req.user.id]);
    await pool.query('DELETE FROM recordatorios WHERE id_usuario = ?',    [req.user.id]);
    res.json({ message: 'Historial eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/account/me — elimina la cuenta completa del usuario
exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;
    // Borrar datos relacionados primero (FK)
    await pool.query('DELETE FROM sesiones_estudio WHERE id_usuario = ?', [id]);
    await pool.query('DELETE FROM recordatorios    WHERE id_usuario = ?', [id]);
    await pool.query('DELETE FROM tareas           WHERE id_usuario = ?', [id]);
    await pool.query('DELETE FROM usuarios         WHERE id_usuario = ?', [id]);
    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
