const db = require('../config/db');

// GET /api/stats/resumen
const resumen = async (req, res) => {
  try {
    const id = req.usuario.id_usuario;

    const [[tareas]]    = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(estado = 'completada') AS completadas,
         SUM(estado = 'pendiente') AS pendientes,
         SUM(estado = 'en_progreso') AS en_progreso
       FROM tareas WHERE id_usuario = ?`, [id]);

    const [[sesiones]]  = await db.query(
      `SELECT
         COUNT(*) AS total_sesiones,
         COALESCE(SUM(duracion_minutos), 0) AS minutos_totales,
         COALESCE(ROUND(SUM(duracion_minutos)/60, 2), 0) AS horas_totales
       FROM sesiones_estudio WHERE id_usuario = ? AND tipo = 'estudio'`, [id]);

    const [[califs]]    = await db.query(
      `SELECT COALESCE(ROUND(AVG(calificacion), 2), 0) AS promedio
       FROM calificaciones WHERE id_usuario = ?`, [id]);

    const [tareasPorDia] = await db.query(
      `SELECT DATE(fecha_creacion) AS dia, COUNT(*) AS total
       FROM tareas WHERE id_usuario = ?
       GROUP BY DATE(fecha_creacion)
       ORDER BY dia DESC LIMIT 7`, [id]);

    res.json({
      tareas,
      sesiones,
      promedio_calificaciones: califs.promedio,
      tareas_por_dia: tareasPorDia
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// GET /api/stats/calificaciones
const calificaciones = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_promedio_calificaciones WHERE id_usuario = ? ORDER BY materia`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
};

// GET /api/stats/tareas-vencidas
const tareasVencidas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_tareas_vencidas WHERE id_usuario = ? ORDER BY dias_vencida DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas vencidas' });
  }
};

module.exports = { resumen, calificaciones, tareasVencidas };
