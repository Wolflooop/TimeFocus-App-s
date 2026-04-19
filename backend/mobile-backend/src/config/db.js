// src/config/db.js
// Pool de conexiones MySQL2 con reconexión automática
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || '127.0.0.1',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'timefocus_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00',
});

// Test de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado →', process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error MySQL:', err.message);
    console.error('   Verifica DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en .env');
  });

module.exports = pool;
