const { db } = require('../db/database');

// GET /stats/summary
exports.getSummary = (req, res) => {
  const devId = req.developer.id;

  const today = db.prepare(
    `SELECT COALESCE(SUM(duration_minutes), 0) as minutes_today,
            COUNT(*) as sessions_today
     FROM study_sessions
     WHERE developer_id = ? AND date = date('now') AND type = 'study'`
  ).get(devId);

  const week = db.prepare(
    `SELECT COALESCE(SUM(duration_minutes), 0) as minutes_week,
            COUNT(*) as sessions_week
     FROM study_sessions
     WHERE developer_id = ? AND date >= date('now', '-7 days') AND type = 'study'`
  ).get(devId);

  const month = db.prepare(
    `SELECT COALESCE(SUM(duration_minutes), 0) as minutes_month
     FROM study_sessions
     WHERE developer_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`
  ).get(devId);

  const tasks = db.prepare(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
     FROM tasks WHERE developer_id = ?`
  ).get(devId);

  res.json({
    success: true,
    data: {
      today: {
        study_minutes: today.minutes_today,
        study_hours: parseFloat((today.minutes_today / 60).toFixed(2)),
        sessions: today.sessions_today,
      },
      week: {
        study_minutes: week.minutes_week,
        study_hours: parseFloat((week.minutes_week / 60).toFixed(2)),
        sessions: week.sessions_week,
      },
      month: {
        study_minutes: month.minutes_month,
        study_hours: parseFloat((month.minutes_month / 60).toFixed(2)),
      },
      tasks,
    },
  });
};

// GET /stats/daily
exports.getDaily = (req, res) => {
  const { days = 7 } = req.query;
  const devId = req.developer.id;

  const rows = db.prepare(
    `SELECT date,
            SUM(duration_minutes) as total_minutes,
            COUNT(*) as sessions
     FROM study_sessions
     WHERE developer_id = ? AND date >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`
  ).all(devId, `-${Number(days)} days`);

  res.json({
    success: true,
    data: rows.map(r => ({
      date: r.date,
      study_minutes: r.total_minutes,
      study_hours: parseFloat((r.total_minutes / 60).toFixed(2)),
      sessions: r.sessions,
    })),
  });
};

// GET /stats/weekly
exports.getWeekly = (req, res) => {
  const { weeks = 4 } = req.query;
  const devId = req.developer.id;

  const rows = db.prepare(
    `SELECT strftime('%Y-W%W', date) as week,
            SUM(duration_minutes) as total_minutes,
            COUNT(*) as sessions
     FROM study_sessions
     WHERE developer_id = ? AND date >= date('now', ?)
     GROUP BY week
     ORDER BY week ASC`
  ).all(devId, `-${Number(weeks) * 7} days`);

  res.json({
    success: true,
    data: rows.map(r => ({
      week: r.week,
      study_minutes: r.total_minutes,
      study_hours: parseFloat((r.total_minutes / 60).toFixed(2)),
      sessions: r.sessions,
    })),
  });
};

// GET /sessions
exports.getSessions = (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;
  const devId = req.developer.id;

  let query = 'SELECT * FROM study_sessions WHERE developer_id = ?';
  const params = [devId];

  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const sessions = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM study_sessions WHERE developer_id = ?').get(devId).c;

  res.json({
    success: true,
    data: sessions,
    meta: { total, limit: Number(limit), offset: Number(offset) },
  });
};

// POST /sessions
exports.createSession = (req, res) => {
  const { date, start_time, end_time, duration_minutes, type, subject } = req.body;

  if (!date || !duration_minutes) {
    return res.status(400).json({ success: false, error: 'date y duration_minutes son requeridos' });
  }

  const result = db.prepare(
    `INSERT INTO study_sessions (developer_id, date, start_time, end_time, duration_minutes, type, subject)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.developer.id, date, start_time || null, end_time || null,
        duration_minutes, type || 'study', subject || null);

  const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: session });
};
