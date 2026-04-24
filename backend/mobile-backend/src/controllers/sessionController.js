// sessionController.js — Mobile backend (corregido)
const pool = require('../config/db');

exports.getSessions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sesiones_estudio WHERE id_usuario = ? ORDER BY fecha DESC, hora_inicio DESC LIMIT 200',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createSession = async (req, res) => {
  const { fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia } = req.body;

  // Mapear tipos del frontend al ENUM de la BD
  const tipoMap = {
    'estudio':        'estudio',
    'descanso':       'descanso_corto',
    'descanso_corto': 'descanso_corto',
    'descanso_largo': 'descanso_largo',
  };
  const tipoFinal = tipoMap[tipo] || 'estudio';

  try {
    const [result] = await pool.query(
      `INSERT INTO sesiones_estudio
         (id_usuario, fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia, completada)
       VALUES (?,?,?,?,?,?,?,1)`,
      [req.user.id, fecha, hora_inicio, hora_fin, duracion_minutos, tipoFinal, materia || null]
    );
    res.status(201).json({ id_sesion: result.insertId, mensaje: 'Sesión guardada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// FIX: ahora incluye porDia y racha que StatsScreen necesita
exports.getStats = async (req, res) => {
  try {
    // Hoy
    const [today] = await pool.query(
      `SELECT COALESCE(SUM(duracion_minutos),0) AS minutos_hoy,
              COUNT(*) AS sesiones_hoy
       FROM sesiones_estudio
       WHERE id_usuario=? AND fecha=CURDATE() AND tipo='estudio'`,
      [req.user.id]
    );

    // Semana actual (lun–dom)
    const [week] = await pool.query(
      `SELECT COALESCE(SUM(duracion_minutos),0) AS minutos_semana,
              COUNT(*) AS sesiones_semana
       FROM sesiones_estudio
       WHERE id_usuario=?
         AND fecha BETWEEN (CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY)
                       AND (CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY + INTERVAL 6 DAY)
         AND tipo='estudio'`,
      [req.user.id]
    );

    // Por día de la semana (1=Dom … 7=Sab en MySQL)
    const [perDay] = await pool.query(
      `SELECT DAYOFWEEK(fecha) AS dia,
              COALESCE(SUM(duracion_minutos),0) AS minutos
       FROM sesiones_estudio
       WHERE id_usuario=?
         AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         AND tipo='estudio'
       GROUP BY DAYOFWEEK(fecha)`,
      [req.user.id]
    );

    // Tareas
    const [tasks] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(estado='completada') AS completadas,
              SUM(estado IN ('pendiente','en_curso','en_progreso')) AS pendientes
       FROM tareas WHERE id_usuario=?`,
      [req.user.id]
    );

    // Racha de días consecutivos con sesión de estudio
    const [streakRows] = await pool.query(
      `SELECT fecha FROM sesiones_estudio
       WHERE id_usuario=? AND tipo='estudio'
       GROUP BY fecha ORDER BY fecha DESC LIMIT 30`,
      [req.user.id]
    );
    let diasRacha = 0;
    if (streakRows.length > 0) {
      const check = new Date();
      check.setHours(0,0,0,0);
      for (const row of streakRows) {
        const d = new Date(row.fecha);
        d.setHours(0,0,0,0);
        const diff = Math.round((check - d) / 86400000);
        if (diff === 0 || diff === diasRacha) {
          diasRacha++;
          check.setDate(check.getDate() - 1);
        } else break;
      }
    }

    // Calificaciones promedio
    const [calProm] = await pool.query(
      'SELECT ROUND(AVG(calificacion),1) AS promedio FROM calificaciones WHERE id_usuario=?',
      [req.user.id]
    );

    res.json({
      hoy:            today[0],
      semana:         week[0],
      porDia:         perDay,
      tareas:         tasks[0],
      racha:          { dias_racha: diasRacha },
      calificaciones: calProm[0],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
