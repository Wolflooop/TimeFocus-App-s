// Agrega las columnas nuevas sin borrar datos existentes
// Ejecutar UNA SOLA VEZ: node src/config/initDB.js
require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Aplicando migraciones...');

    await safe(conn, `ALTER TABLE usuarios
      ADD COLUMN reset_code VARCHAR(6) NULL,
      ADD COLUMN reset_code_expires DATETIME NULL,
      ADD COLUMN google_id VARCHAR(120) NULL,
      ADD COLUMN foto_perfil VARCHAR(255) NULL,
      ADD COLUMN auth_provider ENUM('local','google') NOT NULL DEFAULT 'local'`);

    await safe(conn, `CREATE TABLE IF NOT EXISTS sync_queue (
      id_sync    INT NOT NULL AUTO_INCREMENT,
      id_usuario INT NOT NULL,
      entity     VARCHAR(40) NOT NULL,
      operation  ENUM('create','update','delete') NOT NULL,
      payload    JSON NOT NULL,
      local_id   VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced     TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (id_sync)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    console.log('✅ Migraciones completadas.');
  } finally {
    conn.release();
    process.exit(0);
  }
}

async function safe(conn, sql) {
  try {
    await conn.execute(sql);
    console.log('  ✔', sql.trim().slice(0, 55));
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
      console.log('  ⏭  Ya existe, saltando.');
    } else throw e;
  }
}

migrate();
