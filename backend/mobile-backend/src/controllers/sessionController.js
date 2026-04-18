const pool = require('../config/db');

exports.getSessions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sesiones_estudio WHERE id_usuario = ? ORDER BY fecha DESC, hora_inicio DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSession = async (req, res) => {
  const { fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sesiones_estudio (id_usuario, fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, fecha, hora_inicio, hora_fin, duracion_minutos, tipo || 'estudio', materia]
    );
    res.status(201).json({ id_sesion: result.insertId, mensaje: 'Sesión guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [today] = await pool.query(
      `SELECT COALESCE(SUM(duracion_minutos),0) as minutos_hoy, COUNT(*) as sesiones_hoy 
       FROM sesiones_estudio WHERE id_usuario=? AND fecha=CURDATE() AND tipo='estudio'`,
      [req.user.id]
    );
    const [week] = await pool.query(
      `SELECT COALESCE(SUM(duracion_minutos),0) as minutos_semana 
       FROM sesiones_estudio WHERE id_usuario=? AND fecha >= DATE_SUB(CURDATE(),INTERVAL 7 DAY) AND tipo='estudio'`,
      [req.user.id]
    );
    const [tasks] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(estado='completada') as completadas,
        SUM(estado='pendiente') as pendientes
       FROM tareas WHERE id_usuario=?`,
      [req.user.id]
    );
    res.json({
      hoy: today[0],
      semana: week[0],
      tareas: tasks[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};