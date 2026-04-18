import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { W, H, font, space, radius, rv, rs, clamp, icon } from '../../theme/responsive';
import api from '../../services/api';

// ── Icons ─────────────────────────────────────────────────────────
const ClockIcon = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
    <Line x1="12" y1="7" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Line x1="12" y1="12" x2="16" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

const PlayIcon = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5l11 7-11 7V5z" fill={colors.primary}/>
  </Svg>
);

const CheckIcon = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l5 5L20 7" stroke={color} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronIcon = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.accent} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────
const getDayLabel = () => {
  const days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// ── Component ─────────────────────────────────────────────────────
export default function DashboardScreen({ onNavigate, onReady, tasksVersion }) {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onReady?.(); // FIX: mostramos navbar de inmediato, no esperamos al API
    loadData();
  }, []);

  // Re-sincroniza tareas cuando TasksScreen hace un cambio
  useEffect(() => {
    if (tasksVersion > 0) loadData();
  }, [tasksVersion]);

  const loadData = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        api.get('/sessions/stats'),
        api.get('/tasks'),
      ]);
      setStats(sRes.data);
      setTasks(tRes.data.slice(0, 5));
    } catch (e) {
      // Sin internet o error — carga vacía sin bloquear
      console.log('[Dashboard] Sin conexión, mostrando datos vacíos');
    } finally {
      setLoading(false);
      onReady?.();
    }
  };

  const toggleTask = async (task) => {
    const next = task.estado === 'completada' ? 'pendiente' : 'completada';
    const payload = {
      ...task,
      estado: next,
      fecha_limite: task.fecha_limite
        ? String(task.fecha_limite).slice(0, 10)
        : task.fecha_limite,
    };
    try {
      await api.put(`/tasks/${task.id_tarea}`, payload);
      setTasks(ts =>
        ts.map(t => t.id_tarea === task.id_tarea ? { ...t, estado: next } : t)
      );
    } catch (e) { console.log(e); }
  };

  const horasHoy    = stats ? (stats.hoy.minutos_hoy / 60).toFixed(1) : '0';
  const completadas = stats ? Number(stats.tareas.completadas || 0) : 0;
  const pendientes  = stats ? Number(stats.tareas.pendientes  || 0) : 0;

  const playBtnSize    = clamp(W * 0.075, 30, 48);
  const timerDigitSize = clamp(W * 0.1, 32, 52);
  const checkIconSize  = clamp(W * 0.07, 24, 40);
  const taskCheckSize  = clamp(W * 0.055, 20, 28);

  // FIX: Ya no bloqueamos la UI completa con un spinner.
  // La pantalla se muestra de inmediato; los valores vacíos hacen de skeleton.

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background}/>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.dateText}>{getDayLabel()}</Text>
          <View style={s.greetingRow}>
            <Text style={s.greeting}>Hola, {user?.nombre} 👋</Text>
            {loading && (
              <ActivityIndicator
                color={colors.accent}
                size="small"
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>

        {/* Timer card */}
        <View style={s.timerCard}>
          <View style={s.timerTop}>
            <View style={s.timerLabelRow}>
              <ClockIcon size={clamp(W * 0.03, 11, 16)} color="rgba(255,255,255,0.4)"/>
              <Text style={s.timerLabel}>SESIÓN ACTIVA · POMODORO</Text>
            </View>
            <TouchableOpacity style={[s.playBtn, { width: playBtnSize, height: playBtnSize, borderRadius: clamp(W * 0.02, 8, 14) }]}>
              <PlayIcon size={clamp(W * 0.04, 14, 20)}/>
            </TouchableOpacity>
          </View>
          <Text style={[s.timerDigits, { fontSize: timerDigitSize }]}>00:00</Text>
          <Text style={s.timerSubject}>Sin sesión activa</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '0%' }]}/>
          </View>
          <View style={s.timerFooter}>
            <Text style={s.timerSessions}>0 sesiones hoy</Text>
            <Text style={s.timerPct}>0%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { val: `${horasHoy}h`, label: 'Hoy',        color: colors.primary },
            { val: completadas,    label: 'Tareas ✓',    color: '#4CAF50'      },
            { val: pendientes,     label: 'Pendientes',  color: '#FF9800'      },
            { val: '0🔥',          label: 'Racha',       color: '#FF6B35'      },
          ].map((item, i) => (
            <View key={i} style={s.statCard}>
              <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={s.statLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Tareas */}
        <View style={s.tasksHeader}>
          <Text style={s.tasksTitle}>Tareas de hoy</Text>
          <TouchableOpacity
            style={s.verTodasBtn}
            onPress={() => onNavigate && onNavigate('tasks')}>
            <Text style={s.verTodasText}>Ver todas</Text>
            <ChevronIcon size={clamp(W * 0.035, 13, 18)}/>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={s.emptyBox}>
            <View style={[s.emptyIcon, { width: clamp(W * 0.15, 48, 70), height: clamp(W * 0.15, 48, 70) }]}>
              <CheckIcon size={checkIconSize} color="#4CAF50"/>
            </View>
            <Text style={s.emptyTitle}>¡Sin tareas pendientes!</Text>
            <Text style={s.emptySub}>Agrega una nueva tarea</Text>
          </View>
        ) : tasks.map(task => (
          <TouchableOpacity
            key={task.id_tarea}
            style={s.taskItem}
            onPress={() => toggleTask(task)}
            activeOpacity={0.7}>
            <View style={[s.taskCheck,
              { width: taskCheckSize, height: taskCheckSize, borderRadius: clamp(W * 0.012, 4, 8) },
              task.estado === 'completada' && s.taskCheckDone,
            ]}>
              {task.estado === 'completada' &&
                <CheckIcon size={clamp(W * 0.03, 11, 16)} color="#fff"/>}
            </View>
            <View style={s.taskInfo}>
              <Text style={[s.taskTitle, task.estado === 'completada' && s.taskDone]}
                numberOfLines={1}>
                {task.titulo}
              </Text>
              <Text style={s.taskMeta}>{task.materia} · {String(task.fecha_limite || '').slice(0, 10)}</Text>
            </View>
            <View style={[
              s.badge,
              task.estado === 'completada' && s.badgeDone,
              task.prioridad === 'alta' && task.estado !== 'completada' && s.badgeRed,
              task.prioridad === 'media' && task.estado !== 'completada' && s.badgeBlue,
            ]}>
              <Text style={[
                s.badgeText,
                task.estado === 'completada' && s.badgeTextDone,
                task.prioridad === 'alta' && task.estado !== 'completada' && s.badgeTextRed,
                task.prioridad === 'media' && task.estado !== 'completada' && s.badgeTextBlue,
              ]}>
                {task.estado === 'completada'
                  ? '• Hecho'
                  : task.prioridad === 'alta'  ? '• Urgente'
                  : task.prioridad === 'media' ? '• Curso'
                  : '• Normal'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: rv(16, 10, 24) }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },
  scroll:       { paddingHorizontal: space.screen, paddingTop: rv(12, 8, 18), paddingBottom: rv(16, 10, 24) },
  header:       { marginBottom: rv(12, 8, 18) },
  dateText:     { fontSize: font.xs, color: colors.textSecondary, marginBottom: rv(4, 2, 6) },
  greetingRow:  { flexDirection: 'row', alignItems: 'center' },
  greeting:     { fontSize: clamp(W * 0.06, 18, 30), fontWeight: '800', color: colors.primary },

  timerCard:    { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.md, marginBottom: rv(10, 7, 14) },
  timerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(8, 5, 12) },
  timerLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerLabel:   { fontSize: font.xs, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8 },
  playBtn:      { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  timerDigits:  { color: '#fff', fontFamily: 'monospace', fontWeight: '700', marginBottom: rv(4, 2, 6) },
  timerSubject: { fontSize: font.sm, fontWeight: '700', color: colors.accent, marginBottom: rv(10, 7, 14) },
  progressTrack:{ height: clamp(H * 0.005, 3, 6), backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: rv(8, 5, 10) },
  progressFill: { height: clamp(H * 0.005, 3, 6), backgroundColor: colors.accent, borderRadius: 2 },
  timerFooter:  { flexDirection: 'row', justifyContent: 'space-between' },
  timerSessions:{ fontSize: font.xs, color: 'rgba(255,255,255,0.3)' },
  timerPct:     { fontSize: font.xs, fontWeight: '700', color: colors.accent },

  statsRow:     { flexDirection: 'row', gap: rs(6, 4, 8), marginBottom: rv(14, 10, 20) },
  statCard:     { flex: 1, backgroundColor: '#fff', borderRadius: radius.md,
                  paddingVertical: rv(10, 7, 14), paddingHorizontal: rs(6, 4, 10),
                  alignItems: 'center', borderWidth: 0.5, borderColor: '#E8ECF4' },
  statVal:      { fontSize: clamp(W * 0.052, 16, 26), fontWeight: '800' },
  statLbl:      { fontSize: font.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },

  tasksHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(8, 5, 12) },
  tasksTitle:   { fontSize: clamp(W * 0.038, 13, 18), fontWeight: '800', color: colors.primary },
  verTodasBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verTodasText: { fontSize: font.sm, fontWeight: '700', color: colors.accent },

  emptyBox:     { alignItems: 'center', paddingVertical: rv(32, 20, 44) },
  emptyIcon:    { borderRadius: radius.lg, backgroundColor: '#E8F5E9',
                  alignItems: 'center', justifyContent: 'center', marginBottom: rv(12, 8, 18) },
  emptyTitle:   { fontSize: clamp(W * 0.038, 13, 18), fontWeight: '800', color: colors.primary, marginBottom: rv(4, 2, 6) },
  emptySub:     { fontSize: font.sm, color: colors.textSecondary },

  taskItem:     { flexDirection: 'row', alignItems: 'center', gap: rs(10, 7, 14),
                  backgroundColor: '#fff', borderRadius: radius.md,
                  padding: rs(12, 9, 16), marginBottom: rv(7, 5, 10),
                  borderWidth: 0.5, borderColor: '#E8ECF4' },
  taskCheck:    { borderWidth: 1.5, borderColor: '#D0D8E8',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskCheckDone:{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  taskInfo:     { flex: 1 },
  taskTitle:    { fontSize: font.sm, fontWeight: '600', color: colors.primary },
  taskDone:     { textDecorationLine: 'line-through', color: colors.textSecondary },
  taskMeta:     { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  badge:        { backgroundColor: '#E8F5E9', paddingHorizontal: rs(8, 5, 10),
                  paddingVertical: rv(3, 2, 4), borderRadius: radius.full, flexShrink: 0 },
  badgeRed:     { backgroundColor: '#FFEBEE' },
  badgeBlue:    { backgroundColor: '#E3F2FD' },
  badgeDone:    { backgroundColor: '#E8F5E9' },
  badgeText:    { fontSize: font.xs, fontWeight: '700', color: '#4CAF50' },
  badgeTextRed: { color: '#FF5252' },
  badgeTextBlue:{ color: '#2196F3' },
  badgeTextDone:{ color: '#4CAF50' },
});