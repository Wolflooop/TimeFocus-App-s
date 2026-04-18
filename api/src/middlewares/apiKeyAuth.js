const { db } = require('../db/database');

module.exports = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key requerida',
      hint: 'Incluye tu API Key en el header: X-API-Key: tf_live_xxxxx',
    });
  }

  const key = db.prepare(
    `SELECT ak.*, d.name, d.email
     FROM api_keys ak
     JOIN developers d ON d.id = ak.developer_id
     WHERE ak.key_value = ? AND ak.active = 1`
  ).get(apiKey);

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'API Key inválida o desactivada',
    });
  }

  // Incrementa contador de requests
  db.prepare('UPDATE api_keys SET requests = requests + 1 WHERE id = ?').run(key.id);

  req.developer = {
    id: key.developer_id,
    name: key.name,
    email: key.email,
    keyId: key.id,
  };

  next();
};
