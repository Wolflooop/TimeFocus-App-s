// Ejecutar UNA SOLA VEZ: node src/config/migrateTemas.js
require('dotenv').config();
const pool = require('./db');
 
async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Creando tabla temas...');
 
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS temas (
        id_tema     INT NOT NULL AUTO_INCREMENT,
        id_usuario  INT NOT NULL,
        nombre      VARCHAR(120) NOT NULL,
        profesor    VARCHAR(120) NULL,
        color       VARCHAR(10)  NOT NULL DEFAULT '#1976d2',
        num_tareas  INT          NOT NULL DEFAULT 0,
        creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_tema),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
 
    console.log('✅ Tabla temas creada correctamente.');
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log('⏭  La tabla temas ya existe, no se hizo nada.');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    conn.release();
    process.exit(0);
  }
}
 
migrate();
