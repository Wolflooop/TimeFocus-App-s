// src/controllers/dataController.js
// CRUD completo para todas las entidades de la BD
const pool = require('../config/db');

// ════════════════ CARRERAS ════════════════
exports.getCarreras = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM carreras WHERE estatus=1 ORDER BY nombre_carrera');
  res.json(rows);
};

// ════════════════ TAREAS ════════════════
exports.getTareas = async (req, res) => {
  const uid = req.user.id_usuario;
  const [rows] = await pool.execute(
    `SELECT * FROM tareas WHERE id_usuario=? ORDER BY fecha_limite ASC, prioridad DESC`,
    [uid]
  );
  // Mapear campos al formato que espera el frontend
  const mapped = rows.map(t => ({
    _id:             t.id_tarea,
    id:              t.id_tarea,
    titulo:          t.titulo,
    descripcion:     t.descripcion,
    fechaVencimiento:t.fecha_limite,
    horaLimite:      t.hora_limite,
    prioridad:       t.prioridad,
    estado:          t.estado,
    materia:         t.materia,
    createdAt:       t.fecha_creacion,
  }));
  res.json(mapped);
};

exports.createTarea = async (req, res) => {
  const uid = req.user.id_usuario;
  const { titulo, descripcion, fechaVencimiento, horaLimite, prioridad, materia } = req.body;
  if (!titulo || !fechaVencimiento) return res.status(400).json({ error: 'titulo y fechaVencimiento requeridos' });

  const [result] = await pool.execute(
    `INSERT INTO tareas (id_usuario,titulo,descripcion,fecha_limite,hora_limite,prioridad,estado,materia)
     VALUES (?,?,?,?,?,?,?,?)`,
    [uid, titulo, descripcion||null, fechaVencimiento,
     horaLimite||null, prioridad||'media', 'pendiente', materia||null]
  );
  // Auditoría
  await pool.execute(
    'INSERT INTO auditoria_tareas (id_tarea,id_usuario,accion,estado_nuevo) VALUES (?,?,?,?)',
    [result.insertId, uid, 'crear', 'pendiente']
  );
  const [rows] = await pool.execute('SELECT * FROM tareas WHERE id_tarea=?', [result.insertId]);
  const t = rows[0];
  res.status(201).json({ _id:t.id_tarea, id:t.id_tarea, titulo:t.titulo,
    descripcion:t.descripcion, fechaVencimiento:t.fecha_limite,
    prioridad:t.prioridad, estado:t.estado, materia:t.materia });
};

exports.updateTarea = async (req, res) => {
  const uid = req.user.id_usuario;
  const { id } = req.params;
  const { titulo, descripcion, fechaVencimiento, horaLimite, prioridad, estado, materia } = req.body;

  // Obtener estado previo para auditoría
  const [prev] = await pool.execute('SELECT estado FROM tareas WHERE id_tarea=? AND id_usuario=?', [id, uid]);
  if (!prev.length) return res.status(404).json({ error: 'Tarea no encontrada' });

  await pool.execute(
    `UPDATE tareas SET titulo=COALESCE(?,titulo), descripcion=COALESCE(?,descripcion),
     fecha_limite=COALESCE(?,fecha_limite), hora_limite=COALESCE(?,hora_limite),
     prioridad=COALESCE(?,prioridad), estado=COALESCE(?,estado), materia=COALESCE(?,materia)
     WHERE id_tarea=? AND id_usuario=?`,
    [titulo||null, descripcion||null, fechaVencimiento||null, horaLimite||null,
     prioridad||null, estado||null, materia||null, id, uid]
  );

  if (estado && estado !== prev[0].estado) {
    await pool.execute(
      'INSERT INTO auditoria_tareas (id_tarea,id_usuario,accion,estado_prev,estado_nuevo) VALUES (?,?,?,?,?)',
      [id, uid, 'cambiar_estado', prev[0].estado, estado]
    );
  }
  res.json({ ok: true });
};

exports.deleteTarea = async (req, res) => {
  const uid = req.user.id_usuario;
  const { id } = req.params;
  await pool.execute(
    'INSERT INTO auditoria_tareas (id_tarea,id_usuario,accion) VALUES (?,?,?)', [id, uid, 'eliminar']
  );
  await pool.execute('DELETE FROM tareas WHERE id_tarea=? AND id_usuario=?', [id, uid]);
  res.json({ ok: true });
};

// ════════════════ SESIONES POMODORO ════════════════
exports.getSesiones = async (req, res) => {
  const uid = req.user.id_usuario;
  const { desde, hasta } = req.query;
  let sql = 'SELECT * FROM sesiones_estudio WHERE id_usuario=?';
  const params = [uid];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC, hora_inicio DESC LIMIT 200';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
};

exports.createSesion = async (req, res) => {
  const uid = req.user.id_usuario;
  const { fecha, hora_inicio, hora_fin, duracion_minutos, tipo, materia } = req.body;
  if (!fecha || !hora_inicio || !hora_fin || !duracion_minutos)
    return res.status(400).json({ error: 'Campos requeridos: fecha, hora_inicio, hora_fin, duracion_minutos' });

  const [result] = await pool.execute(
    `INSERT INTO sesiones_estudio (id_usuario,fecha,hora_inicio,hora_fin,duracion_minutos,tipo,materia,completada)
     VALUES (?,?,?,?,?,?,?,1)`,
    [uid, fecha, hora_inicio, hora_fin, duracion_minutos, tipo||'estudio', materia||null]
  );
  res.status(201).json({ id_sesion: result.insertId });
};

// ════════════════ HORARIOS ════════════════
exports.getHorarios = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM horarios WHERE id_usuario=? AND activo=1 ORDER BY FIELD(dia_semana,"lunes","martes","miercoles","jueves","viernes","sabado"), hora_inicio',
    [req.user.id_usuario]
  );
  res.json(rows);
};

exports.createHorario = async (req, res) => {
  const uid = req.user.id_usuario;
  const { materia, dia_semana, hora_inicio, hora_fin, aula, nombre_docente, ap_paterno_doc, ap_materno_doc } = req.body;
  if (!materia || !dia_semana || !hora_inicio || !hora_fin)
    return res.status(400).json({ error: 'materia, dia_semana, hora_inicio, hora_fin requeridos' });

  const [result] = await pool.execute(
    `INSERT INTO horarios (id_usuario,materia,dia_semana,hora_inicio,hora_fin,aula,nombre_docente,ap_paterno_doc,ap_materno_doc)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uid, materia, dia_semana, hora_inicio, hora_fin,
     aula||null, nombre_docente||null, ap_paterno_doc||null, ap_materno_doc||null]
  );
  res.status(201).json({ id_horario: result.insertId });
};

exports.deleteHorario = async (req, res) => {
  await pool.execute('UPDATE horarios SET activo=0 WHERE id_horario=? AND id_usuario=?',
    [req.params.id, req.user.id_usuario]);
  res.json({ ok: true });
};

// ════════════════ CALIFICACIONES ════════════════
exports.getCalificaciones = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM calificaciones WHERE id_usuario=? ORDER BY fecha_registro DESC',
    [req.user.id_usuario]
  );
  res.json(rows);
};

exports.createCalificacion = async (req, res) => {
  const uid = req.user.id_usuario;
  const { materia, periodo, calificacion, tipo_evaluacion, fecha_registro, observaciones } = req.body;
  if (!materia || !periodo || calificacion == null || !tipo_evaluacion || !fecha_registro)
    return res.status(400).json({ error: 'Campos requeridos faltantes' });

  const [result] = await pool.execute(
    `INSERT INTO calificaciones (id_usuario,materia,periodo,calificacion,tipo_evaluacion,fecha_registro,observaciones)
     VALUES (?,?,?,?,?,?,?)`,
    [uid, materia, periodo, calificacion, tipo_evaluacion, fecha_registro, observaciones||null]
  );
  res.status(201).json({ id_calificacion: result.insertId });
};

// ════════════════ EVENTOS ACADÉMICOS ════════════════
exports.getEventos = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM eventos_academicos WHERE id_usuario=? ORDER BY fecha_inicio ASC',
    [req.user.id_usuario]
  );
  res.json(rows);
};

exports.createEvento = async (req, res) => {
  const uid = req.user.id_usuario;
  const { titulo, tipo, fecha_inicio, fecha_fin, lugar, materia, notas, recordatorio_min } = req.body;
  if (!titulo || !tipo || !fecha_inicio)
    return res.status(400).json({ error: 'titulo, tipo y fecha_inicio requeridos' });

  const [result] = await pool.execute(
    `INSERT INTO eventos_academicos (id_usuario,titulo,tipo,fecha_inicio,fecha_fin,lugar,materia,notas,recordatorio_min)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uid, titulo, tipo, fecha_inicio, fecha_fin||null, lugar||null,
     materia||null, notas||null, recordatorio_min||null]
  );
  res.status(201).json({ id_evento: result.insertId });
};

exports.deleteEvento = async (req, res) => {
  await pool.execute('DELETE FROM eventos_academicos WHERE id_evento=? AND id_usuario=?',
    [req.params.id, req.user.id_usuario]);
  res.json({ ok: true });
};

// ════════════════ STATS / DASHBOARD ════════════════
exports.getStats = async (req, res) => {
  const uid = req.user.id_usuario;
  const hoy = new Date().toISOString().slice(0, 10);
  const lunesActual = getMondayISO();

  const [[totTareas]]   = await pool.execute('SELECT COUNT(*) as total FROM tareas WHERE id_usuario=?', [uid]);
  const [[pendientes]]  = await pool.execute('SELECT COUNT(*) as total FROM tareas WHERE id_usuario=? AND estado="pendiente"', [uid]);
  const [[completadas]] = await pool.execute('SELECT COUNT(*) as total FROM tareas WHERE id_usuario=? AND estado="completada"', [uid]);
  const [[pomHoy]]      = await pool.execute('SELECT COUNT(*) as total, COALESCE(SUM(duracion_minutos),0) as minutos FROM sesiones_estudio WHERE id_usuario=? AND fecha=? AND tipo="estudio"', [uid, hoy]);
  const [[pomSemana]]   = await pool.execute('SELECT COALESCE(SUM(duracion_minutos),0) as minutos FROM sesiones_estudio WHERE id_usuario=? AND fecha>=? AND tipo="estudio"', [uid, lunesActual]);
  const [[calProm]]     = await pool.execute('SELECT ROUND(AVG(calificacion),1) as promedio FROM calificaciones WHERE id_usuario=?', [uid]);

  const [proximasTareas] = await pool.execute(
    `SELECT titulo,fecha_limite,prioridad FROM tareas
     WHERE id_usuario=? AND estado!='completada' AND fecha_limite >= ?
     ORDER BY fecha_limite ASC LIMIT 5`,
    [uid, hoy]
  );

  res.json({
    tareas: {
      total:      totTareas.total,
      pendientes: pendientes.total,
      completadas:completadas.total,
    },
    pomodoros: {
      hoy:         pomHoy.total,
      minutosHoy:  pomHoy.minutos,
      minutosSemana: pomSemana.minutos,
    },
    calificaciones: {
      promedio: calProm.promedio || 0,
    },
    proximasTareas,
  });
};

// ════════════════ PERFIL / USUARIO ════════════════
exports.updatePerfil = async (req, res) => {
  const uid = req.user.id_usuario;
  const { nombre, segundo_nombre, apellido_paterno, apellido_materno, telefono, id_carrera } = req.body;
  await pool.execute(
    `UPDATE usuarios SET nombre=COALESCE(?,nombre), segundo_nombre=COALESCE(?,segundo_nombre),
     apellido_paterno=COALESCE(?,apellido_paterno), apellido_materno=COALESCE(?,apellido_materno),
     telefono=COALESCE(?,telefono), id_carrera=COALESCE(?,id_carrera)
     WHERE id_usuario=?`,
    [nombre||null, segundo_nombre||null, apellido_paterno||null, apellido_materno||null,
     telefono||null, id_carrera||null, uid]
  );
  res.json({ ok: true });
};

// ════════════════ SYNC (offline) ════════════════
exports.syncOffline = async (req, res) => {
  const uid  = req.user.id_usuario;
  const { items } = req.body;  // Array de { entity, operation, payload, local_id }
  if (!Array.isArray(items) || !items.length) return res.json({ synced: 0 });

  let synced = 0;
  for (const item of items) {
    try {
      await pool.execute(
        'INSERT INTO sync_queue (id_usuario,entity,operation,payload,local_id,synced) VALUES (?,?,?,?,?,1)',
        [uid, item.entity, item.operation, JSON.stringify(item.payload), item.local_id||null]
      );
      synced++;
    } catch(e) { console.warn('sync item error', e.message); }
  }
  res.json({ synced });
};

// ─── Helper ───────────────────────────────────────────────────────
function getMondayISO() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
