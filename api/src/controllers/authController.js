const bcrypt = require('bcryptjs');
const { db, generateApiKey } = require('../db/database');

// POST /auth/register
exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'name, email y password son requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'La contraseña debe tener mínimo 8 caracteres' });
  }

  const exists = db.prepare('SELECT id FROM developers WHERE email = ?').get(email);
  if (exists) {
    return res.status(409).json({ success: false, error: 'El correo ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO developers (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email, hash);

  // Genera API Key automáticamente
  const apiKey = generateApiKey();
  db.prepare(
    'INSERT INTO api_keys (developer_id, key_value, name) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, apiKey, 'Default Key');

  res.status(201).json({
    success: true,
    message: 'Cuenta de desarrollador creada exitosamente',
    data: {
      developer: { id: result.lastInsertRowid, name, email },
      api_key: apiKey,
      warning: 'Guarda tu API Key, no se mostrará de nuevo',
    },
  });
};

// POST /auth/login
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email y password son requeridos' });
  }

  const dev = db.prepare('SELECT * FROM developers WHERE email = ?').get(email);
  if (!dev || !bcrypt.compareSync(password, dev.password)) {
    return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  }

  const keys = db.prepare(
    'SELECT id, key_value, name, active, requests, created_at FROM api_keys WHERE developer_id = ?'
  ).all(dev.id);

  res.json({
    success: true,
    data: {
      developer: { id: dev.id, name: dev.name, email: dev.email },
      api_keys: keys,
    },
  });
};

// POST /auth/keys — crear nueva API Key
exports.createKey = (req, res) => {
  const { name } = req.body;
  const devId = req.developer.id;

  const count = db.prepare('SELECT COUNT(*) as c FROM api_keys WHERE developer_id = ? AND active = 1').get(devId);
  if (count.c >= 5) {
    return res.status(400).json({ success: false, error: 'Máximo 5 API Keys activas por cuenta' });
  }

  const apiKey = generateApiKey();
  const result = db.prepare(
    'INSERT INTO api_keys (developer_id, key_value, name) VALUES (?, ?, ?)'
  ).run(devId, apiKey, name || 'Nueva Key');

  res.status(201).json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      key_value: apiKey,
      name: name || 'Nueva Key',
      warning: 'Guarda tu API Key, no se mostrará de nuevo',
    },
  });
};

// DELETE /auth/keys/:id — revocar API Key
exports.revokeKey = (req, res) => {
  const { id } = req.params;
  db.prepare(
    'UPDATE api_keys SET active = 0 WHERE id = ? AND developer_id = ?'
  ).run(id, req.developer.id);

  res.json({ success: true, message: 'API Key revocada exitosamente' });
};
