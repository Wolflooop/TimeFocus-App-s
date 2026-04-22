import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable, ScrollView,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { W, rs, rv, clamp, font, space, radius } from '../../theme/responsive';
import api from '../../services/api';

const SHORT_BREAK  = 5;
const LONG_BREAK   = 15;
const MODES        = { POMODORO: 'pomodoro', SHORT: 'short', LONG: 'long' };
const MAX_SESSIONS = 20;
const MIN_SESSIONS = 1;

const RING_SIZE = clamp(W * 0.54, 180, 230);
const STROKE_W  = clamp(W * 0.022, 7, 12);
const RING_R    = (RING_SIZE / 2) - STROKE_W - 2;
const CIRC      = 2 * Math.PI * RING_R;

const pad = (n) => String(n).padStart(2, '0');
const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const todayDate = () => new Date().toISOString().slice(0, 10);

export default function TimerScreen() {
  const [pomodoroMin, setPomodoroMin]     = useState(25);
  const [totalSessions, setTotalSessions] = useState(4);
  const [mode, setMode]                   = useState(MODES.POMODORO);
  const [isBreak, setIsBreak]             = useState(false);
  const [timeLeft, setTimeLeft]           = useState(25 * 60);
  const [isRunning, setIsRunning]         = useState(false);
  const [done, setDone]                   = useState(0);
  const [sessionName, setSessionName]     = useState('Sesión de estudio');
  const [showSettings, setShowSettings]   = useState(false);
  const [tmpPomodoro, setTmpPomodoro]     = useState(25);
  const [tmpSessions, setTmpSessions]     = useState(4);

  const intervalRef  = useRef(null);
  const startTimeRef = useRef(null); // hora de inicio del pomodoro actual

  const totalSecs = () =>
    mode === MODES.POMODORO ? pomodoroMin * 60
    : mode === MODES.SHORT   ? SHORT_BREAK * 60
    : LONG_BREAK * 60;

  const progress = Math.max(0, Math.min(1, 1 - timeLeft / totalSecs()));

  useEffect(() => {
    if (isRunning) {
      if (mode === MODES.POMODORO && !startTimeRef.current) {
        startTimeRef.current = nowTime();
      }
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning && mode === MODES.POMODORO) {
      setTimeLeft(pomodoroMin * 60);
    }
  }, [pomodoroMin]);

  // Guarda la sesion en la BD cuando termina un Pomodoro
  const saveSession = async (duracion) => {
    try {
      await api.post('/sessions', {
        fecha:             todayDate(),
        hora_inicio:       startTimeRef.current || nowTime(),
        hora_fin:          nowTime(),
        duracion_minutos:  duracion,
        tipo:              'estudio',
        materia:           sessionName,
      });
    } catch (e) {
      console.log('[Timer] No se pudo guardar sesion:', e.message);
    } finally {
      startTimeRef.current = null;
    }
  };

  const handleComplete = () => {
    if (!isBreak) {
      saveSession(pomodoroMin);
      setDone((d) => Math.min(d + 1, totalSessions));
      setIsBreak(true);
      setMode(MODES.SHORT);
      setTimeLeft(SHORT_BREAK * 60);
    } else {
      setIsBreak(false);
      setMode(MODES.POMODORO);
      setTimeLeft(pomodoroMin * 60);
    }
  };

  const switchMode = (m) => {
    setIsRunning(false);
    startTimeRef.current = null;
    setMode(m);
    if (m === MODES.POMODORO) { setIsBreak(false); setTimeLeft(pomodoroMin * 60); }
    else if (m === MODES.SHORT) { setIsBreak(true); setTimeLeft(SHORT_BREAK * 60); }
    else { setIsBreak(true); setTimeLeft(LONG_BREAK * 60); }
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = null;
    setTimeLeft(totalSecs());
  };

  const handleSkip = () => {
    setIsRunning(false);
    startTimeRef.current = null;
    setIsBreak(false);
    setMode(MODES.POMODORO);
    setTimeLeft(pomodoroMin * 60);
  };

  const saveSettings = () => {
    const p = Math.min(Math.max(tmpPomodoro, MIN_SESSIONS), MAX_SESSIONS);
    const s = Math.min(Math.max(tmpSessions, MIN_SESSIONS), MAX_SESSIONS);
    setPomodoroMin(p);
    setTotalSessions(s);
    if (mode === MODES.POMODORO) setTimeLeft(p * 60);
    setShowSettings(false);
  };

  const BG           = isBreak ? '#0A2E1E' : colors.surface;
  const RING_COLOR   = isBreak ? '#22C55E' : colors.accent;
  const RING_TRACK   = isBreak ? 'rgba(34,197,94,0.18)' : '#EDEEF3';
  const TEXT_PRI     = isBreak ? '#FFFFFF'  : colors.textPrimary;
  const TEXT_SEC     = isBreak ? 'rgba(255,255,255,0.55)' : colors.textSecondary;
  const PILL_ACTIVE  = isBreak ? 'rgba(34,197,94,0.25)' : colors.primary;
  const BTN_PRIMARY  = isBreak ? '#22C55E' : colors.primary;
  const BTN_SEC      = isBreak ? 'rgba(255,255,255,0.10)' : '#F0F1F6';

  const dashOffset = CIRC * (1 - progress);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: TEXT_PRI }]}>
          {isBreak ? 'Descanso' : 'Temporizador'}
        </Text>
        {isBreak && (
          <Text style={[s.headerSub, { color: TEXT_SEC }]}>
            Sesión {done} completada 🎉
          </Text>
        )}
        <TouchableOpacity style={s.gearBtn} onPress={() => {
          setTmpPomodoro(pomodoroMin);
          setTmpSessions(totalSessions);
          setShowSettings(true);
        }}>
          <Text style={{ fontSize: rs(18), opacity: 0.6 }}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Info card */}
      {!isBreak ? (
        <View style={[s.sessionCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[s.sessionLabel, { color: TEXT_SEC }]}>SESIÓN VINCULADA</Text>
          <View style={s.sessionRow}>
            <Text style={[s.sessionName, { color: TEXT_PRI }]} numberOfLines={1}>
              {sessionName}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[s.breakCard, { backgroundColor: '#0F3D28', borderColor: 'rgba(34,197,94,0.25)' }]}>
          <Text style={s.trophyIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.breakCardTitle}>¡Sesión guardada!</Text>
            <Text style={s.breakCardSub}>{pomodoroMin} min registrados en tu historial</Text>
          </View>
        </View>
      )}

      {/* Mode pills */}
      <View style={s.pillsRow}>
        {[
          { m: MODES.POMODORO, label: `Pomodoro ${pomodoroMin}'` },
          { m: MODES.SHORT,    label: `Corto ${SHORT_BREAK}'` },
          { m: MODES.LONG,     label: `Largo ${LONG_BREAK}'` },
        ].map(({ m, label }) => {
          const active = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[s.pill, { backgroundColor: active ? PILL_ACTIVE : 'transparent' }]}
              onPress={() => switchMode(m)}
              activeOpacity={0.75}>
              <Text style={[
                s.pillText,
                { color: active ? (isBreak ? '#22C55E' : '#FFFFFF') : TEXT_SEC,
                  fontWeight: active ? '700' : '500' },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ring */}
      <View style={s.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <G rotation="-90" origin={`${RING_SIZE / 2},${RING_SIZE / 2}`}>
            <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
              stroke={RING_TRACK} strokeWidth={STROKE_W} fill="none"/>
            <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
              stroke={RING_COLOR} strokeWidth={STROKE_W} fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"/>
          </G>
        </Svg>
        <View style={[s.ringInner, { width: RING_SIZE, height: RING_SIZE }]}>
          <Text style={[s.timeText, { color: TEXT_PRI }]}>{fmt(timeLeft)}</Text>
          <Text style={[s.timeSub, { color: isBreak ? '#22C55E' : TEXT_SEC }]}>
            {isBreak ? 'DESCANSANDO' : 'ESTUDIANDO'}
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={s.btnsRow}>
        {isBreak ? (
          <TouchableOpacity style={[s.btnSecondary, { backgroundColor: BTN_SEC }]}
            onPress={handleSkip} activeOpacity={0.75}>
            <Text style={[s.btnSecText, { color: TEXT_PRI }]}>Saltar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnSecondary, { backgroundColor: BTN_SEC }]}
            onPress={handleReset} activeOpacity={0.75}>
            <Text style={[s.btnSecText, { color: TEXT_PRI }]}>↺  Reiniciar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: BTN_PRIMARY }]}
          onPress={() => setIsRunning((r) => !r)} activeOpacity={0.82}>
          <Text style={s.btnPriText}>
            {isRunning ? '⏸  Pausar' : '▶  Iniciar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions row */}
      <View style={s.sessionsRow}>
        <Text style={[s.sessionsLabel, { color: TEXT_SEC }]}>Sesiones completadas hoy</Text>
        <View style={s.dotsWrap}>
          {Array.from({ length: totalSessions }).map((_, i) => (
            <View key={i} style={[
              s.sessionDot,
              i < done && { backgroundColor: isBreak ? '#22C55E' : colors.accent },
            ]}/>
          ))}
        </View>
        <Text style={[s.sessionsCount, { color: isBreak ? '#22C55E' : colors.accent }]}>
          {done}/{totalSessions}
        </Text>
      </View>

      {/* Settings modal */}
      <Modal visible={showSettings} transparent animationType="slide"
        onRequestClose={() => setShowSettings(false)}>
        <Pressable style={s.overlay} onPress={() => setShowSettings(false)}/>
        <View style={s.sheet}>
          <View style={s.sheetHandle}/>
          <Text style={s.sheetTitle}>Configuración</Text>
          <Text style={s.sheetLabel}>
            Duración Pomodoro: <Text style={{ color: colors.accent, fontWeight: '700' }}>{tmpPomodoro} min</Text>
          </Text>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn}
              onPress={() => setTmpPomodoro((v) => Math.max(MIN_SESSIONS, v - 1))}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={s.stepValueBox}>
              {Array.from({ length: MAX_SESSIONS }).map((_, i) => {
                const val = i + 1;
                const sel = val === tmpPomodoro;
                return (
                  <TouchableOpacity key={val} style={[s.stepChip, sel && s.stepChipActive]}
                    onPress={() => setTmpPomodoro(val)}>
                    <Text style={[s.stepChipText, sel && s.stepChipTextActive]}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={s.stepBtn}
              onPress={() => setTmpPomodoro((v) => Math.min(MAX_SESSIONS, v + 1))}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.sheetLabel, { marginTop: rv(18) }]}>
            Sesiones por día: <Text style={{ color: colors.accent, fontWeight: '700' }}>{tmpSessions}</Text>
          </Text>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn}
              onPress={() => setTmpSessions((v) => Math.max(MIN_SESSIONS, v - 1))}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={s.stepValueBox}>
              {Array.from({ length: MAX_SESSIONS }).map((_, i) => {
                const val = i + 1;
                const sel = val === tmpSessions;
                return (
                  <TouchableOpacity key={val} style={[s.stepChip, sel && s.stepChipActive]}
                    onPress={() => setTmpSessions(val)}>
                    <Text style={[s.stepChipText, sel && s.stepChipTextActive]}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={s.stepBtn}
              onPress={() => setTmpSessions((v) => Math.min(MAX_SESSIONS, v + 1))}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={saveSettings}>
            <Text style={s.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const HORIZ = clamp(W * 0.05, 16, 24);

const s = StyleSheet.create({
  root:           { flex:1, paddingHorizontal:HORIZ, paddingTop:rv(16) },
  header:         { flexDirection:'row', alignItems:'center', marginBottom:rv(14), gap:6 },
  headerTitle:    { fontSize:font.xl, fontWeight:'800', letterSpacing:-0.4, flex:1 },
  headerSub:      { fontSize:font.sm, fontWeight:'500' },
  gearBtn:        { padding:6 },
  sessionCard:    { borderRadius:radius.lg, borderWidth:1, paddingHorizontal:rs(14), paddingVertical:rv(10), marginBottom:rv(14) },
  sessionLabel:   { fontSize:font.xs, fontWeight:'600', letterSpacing:0.8, marginBottom:4 },
  sessionRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  sessionName:    { fontSize:font.md, fontWeight:'700', flex:1, marginRight:8 },
  breakCard:      { flexDirection:'row', alignItems:'center', borderRadius:radius.lg, borderWidth:1, paddingHorizontal:rs(16), paddingVertical:rv(12), marginBottom:rv(14), gap:12 },
  trophyIcon:     { fontSize:rs(28) },
  breakCardTitle: { fontSize:font.md, fontWeight:'700', color:'#FFFFFF', marginBottom:2 },
  breakCardSub:   { fontSize:font.sm, color:'rgba(255,255,255,0.6)' },
  pillsRow:       { flexDirection:'row', gap:clamp(W*0.02,6,10), marginBottom:rv(20) },
  pill:           { flexDirection:'row', alignItems:'center', paddingHorizontal:clamp(W*0.03,10,16), paddingVertical:rv(6), borderRadius:radius.full, gap:5 },
  pillText:       { fontSize:font.sm },
  ringWrapper:    { alignSelf:'center', alignItems:'center', justifyContent:'center', marginBottom:rv(28) },
  ringInner:      { position:'absolute', alignItems:'center', justifyContent:'center' },
  timeText:       { fontSize:clamp(W*0.14,44,60), fontWeight:'800', letterSpacing:-1 },
  timeSub:        { fontSize:font.xs, fontWeight:'700', letterSpacing:2, marginTop:2 },
  btnsRow:        { flexDirection:'row', gap:clamp(W*0.03,10,16), marginBottom:rv(22) },
  btnSecondary:   { flex:1, paddingVertical:rv(14), borderRadius:radius.xl, alignItems:'center', justifyContent:'center' },
  btnSecText:     { fontSize:font.md, fontWeight:'600' },
  btnPrimary:     { flex:2, paddingVertical:rv(14), borderRadius:radius.xl, alignItems:'center', justifyContent:'center' },
  btnPriText:     { fontSize:font.md, fontWeight:'700', color:'#FFFFFF', letterSpacing:0.3 },
  sessionsRow:    { flexDirection:'row', alignItems:'center', gap:8 },
  sessionsLabel:  { fontSize:font.sm, flex:1 },
  dotsWrap:       { flexDirection:'row', gap:5, flexWrap:'wrap', maxWidth:W*0.45, justifyContent:'flex-end' },
  sessionDot:     { width:10, height:10, borderRadius:5, backgroundColor:'#D1D5E0' },
  sessionsCount:  { fontSize:font.sm, fontWeight:'700', minWidth:30, textAlign:'right' },
  overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.45)' },
  sheet:          { backgroundColor:'#FFFFFF', borderTopLeftRadius:radius.xl, borderTopRightRadius:radius.xl, paddingHorizontal:HORIZ, paddingTop:rv(12), paddingBottom:rv(40) },
  sheetHandle:    { alignSelf:'center', width:38, height:4, borderRadius:2, backgroundColor:'#D1D5E0', marginBottom:rv(16) },
  sheetTitle:     { fontSize:font.lg, fontWeight:'800', color:colors.textPrimary, marginBottom:rv(18) },
  sheetLabel:     { fontSize:font.sm, color:colors.textSecondary, fontWeight:'500', marginBottom:rv(10) },
  stepper:        { flexDirection:'row', alignItems:'center', gap:10 },
  stepBtn:        { width:36, height:36, borderRadius:18, backgroundColor:colors.surface2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  stepBtnText:    { fontSize:rs(20), fontWeight:'600', color:colors.textPrimary, lineHeight:rs(24) },
  stepValueBox:   { flex:1, flexDirection:'row', flexWrap:'wrap', gap:5 },
  stepChip:       { width:clamp((W-HORIZ*2-92)/10-5,22,30), height:clamp((W-HORIZ*2-92)/10-5,22,30), borderRadius:6, backgroundColor:colors.surface2, alignItems:'center', justifyContent:'center' },
  stepChipActive: { backgroundColor:colors.primary },
  stepChipText:   { fontSize:font.xs, fontWeight:'600', color:colors.textSecondary },
  stepChipTextActive:{ color:'#FFFFFF' },
  saveBtn:        { marginTop:rv(24), backgroundColor:colors.primary, borderRadius:radius.xl, paddingVertical:rv(14), alignItems:'center' },
  saveBtnText:    { color:'#FFFFFF', fontWeight:'700', fontSize:font.md },
});
