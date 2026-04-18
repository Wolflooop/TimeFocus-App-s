const { db } = require('../db/database');

// GET /tasks
exports.getTasks = (req, res) => {
  const { status, priority, subject, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM tasks WHERE developer_id = ?';
  const params = [req.developer.id];

  if (status)   { query += ' AND status = ?';   params.push(status); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (subject)  { query += ' AND subject LIKE ?'; params.push(`%${subject}%`); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const tasks = db.prepare(query).all(...params);
  const total = db.prepare(
    'SELECT COUNT(*) as c FROM tasks WHERE developer_id = ?'
  ).get(req.developer.id).c;

  res.json({
    success: true,
    data: tasks,
    meta: { total, limit: Number(limit), offset: Number(offset) },
  });
};

// GET /tasks/:id
exports.getTask = (req, res) => {
  const task = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND developer_id = ?'
  ).get(req.params.id, req.developer.id);

  if (!task) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
  res.json({ success: true, data: task });
};

// POST /tasks
exports.createTask = (req, res) => {
  const { title, description, status, priority, due_date, subject } = req.body;

  if (!title) return res.status(400).json({ success: false, error: 'title es requerido' });

  const validStatus   = ['pending', 'in_progress', 'completed'];
  const validPriority = ['low', 'medium', 'high'];

  if (status   && !validStatus.includes(status))
    return res.status(400).json({ success: false, error: `status debe ser: ${validStatus.join(', ')}` });
  if (priority && !validPriority.includes(priority))
    return res.status(400).json({ success: false, error: `priority debe ser: ${validPriority.join(', ')}` });

  const result = db.prepare(
    `INSERT INTO tasks (developer_id, title, description, status, priority, due_date, subject)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.developer.id, title, description || null, status || 'pending',
        priority || 'medium', due_date || null, subject || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: task });
};

// PUT /tasks/:id
exports.updateTask = (req, res) => {
  const { title, description, status, priority, due_date, subject } = req.body;
  const { id } = req.params;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND developer_id = ?').get(id, req.developer.id);
  if (!task) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });

  db.prepare(
    `UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      due_date = ?, subject = ?, updated_at = datetime('now')
     WHERE id = ? AND developer_id = ?`
  ).run(
    title       ?? task.title,
    description ?? task.description,
    status      ?? task.status,
    priority    ?? task.priority,
    due_date    ?? task.due_date,
    subject     ?? task.subject,
    id, req.developer.id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
};

// DELETE /tasks/:id
exports.deleteTask = (req, res) => {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND developer_id = ?').get(req.params.id, req.developer.id);
  if (!task) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Tarea eliminada' });
};
