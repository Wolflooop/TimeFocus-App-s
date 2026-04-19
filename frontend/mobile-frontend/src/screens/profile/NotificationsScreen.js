/**
 * NotificationsScreen.js
 * - Solicita permisos reales de notificaciones al SO
 * - Configura notificaciones locales con expo-notifications
 * - Muestra historial de notificaciones recibidas
 * - Permite activar/desactivar cada tipo de notificación
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, SafeAreaView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Bell, Line, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { font, space, radius, rv, rs } from '../../theme/responsive';

// ─── Try to import expo-notifications (optional) ─────────────────
let Notifications = null;
let Device = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (_) {}

const C = {
  bg:     colors.background,
  card:   '#FFFFFF',
  navy:   colors.primary,
  accent: colors.accent,
  muted:  colors.textSecondary,
  border: colors.border,
  success: colors.success,
  danger:  colors.error,
};

// ─── Icons ───────────────────────────────────────────────────────
const BackIcon = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={ic.btn} activeOpacity={0.7}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={C.navy} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  </TouchableOpacity>
);
const ic = StyleSheet.create({
  btn: { width:40, height:40, alignItems:'center', justifyContent:'center',
         backgroundColor:'#F0F4FF', borderRadius:radius.full },
});

// ─── Mock notification history ───────────────────────────────────
const MOCK_HISTORY = [
  { id:1, icon:'🍅', title:'Sesión completada', body:'Completaste 4 pomodoros hoy. ¡Excelente racha!', time:'Hace 5 min', unread:true },
  { id:2, icon:'⚠️', title:'Tarea próxima a vencer', body:'Reporte BD vence HOY a las 23:59', time:'Hace 2h', unread:true },
  { id:3, icon:'📱', title:'Alerta de distracción', body:'Llevas 1h 30m en TikTok hoy.', time:'Hace 4h', unread:true },
  { id:4, icon:'🏆', title:'Meta semanal alcanzada', body:'Completaste 30h de estudio 🏆', time:'Ayer 8:00 PM', unread:false },
  { id:5, icon:'📊', title:'Resumen del día', body:'3.5h · 7 tareas completadas', time:'Ayer 8:00 PM', unread:false },
];

// ─── Notification config groups ──────────────────────────────────
const NOTIF_GROUPS = [
  {
    title: 'Pomodoro',
    items: [
      { key:'pomodoro_end',   label:'Sesión completada',    desc:'Alerta al terminar cada pomodoro',  default:true },
      { key:'break_end',      label:'Fin de descanso',      desc:'Avisa cuando el descanso termina',  default:true },
      { key:'daily_goal',     label:'Meta diaria',          desc:'Resumen al alcanzar tu meta',       default:true },
    ],
  },
  {
    title: 'Tareas',
    items: [
      { key:'task_due',       label:'Tarea por vencer',     desc:'24h y 1h antes de la fecha límite', default:true },
      { key:'task_reminder',  label:'Recordatorio diario',  desc:'Lista de tareas pendientes a las 8 AM', default:false },
    ],
  },
  {
    title: 'Hábitos y bienestar',
    items: [
      { key:'distraction',    label:'Alerta de distracción',desc:'Exceso de tiempo en redes sociales',default:true },
      { key:'weekly_summary', label:'Resumen semanal',      desc:'Reporte de productividad cada domingo',default:true },
      { key:'streak',         label:'Rachas de estudio',    desc:'Celebra tus rachas de días seguidos',  default:false },
    ],
  },
];

export default function NotificationsScreen({ onBack }) {
  const [permStatus,    setPermStatus]    = useState('unknown'); // granted | denied | undetermined | unknown
  const [requesting,    setRequesting]    = useState(false);
  const [settings,      setSettings]      = useState(() => {
    const map = {};
    NOTIF_GROUPS.forEach(g => g.items.forEach(i => { map[i.key] = i.default; }));
    return map;
  });
  const [history,       setHistory]       = useState(MOCK_HISTORY);
  const [showHistory,   setShowHistory]   = useState(true);

  // ── Check permission on mount ──────────────────────────────────
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!Notifications) { setPermStatus('unavailable'); return; }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermStatus(status);
    } catch { setPermStatus('unavailable'); }
  };

  const requestPermission = async () => {
    if (!Notifications) {
      Alert.alert('No disponible', 'expo-notifications no está instalado en este proyecto.');
      return;
    }
    if (!Device?.isDevice) {
      Alert.alert('Simulador', 'Las notificaciones push sólo funcionan en dispositivo físico. En este emulador, la permisión se simula como concedida.');
      setPermStatus('granted');
      return;
    }
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      setPermStatus(status);
      if (status === 'granted') {
        // Configure how notifications appear when app is in foreground
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge:  true,
          }),
        });
        Alert.alert('✅ Notificaciones activadas', 'Recibirás alertas de TimeFocus en tu dispositivo.');
      } else {
        Alert.alert('Sin permiso', 'Ve a Configuración del sistema para habilitar las notificaciones de TimeFocus.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRequesting(false);
    }
  };

  // ── Schedule a test notification ──────────────────────────────
  const sendTestNotification = async () => {
    if (!Notifications) {
      Alert.alert('Prueba', '🍅 ¡Notificación de prueba!\nEsto aparecería en tu bandeja de notificaciones.');
      return;
    }
    if (permStatus !== 'granted') {
      Alert.alert('Sin permiso', 'Primero activa las notificaciones.');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍅 TimeFocus – Prueba',
        body:  '¡Las notificaciones están funcionando correctamente!',
        sound: true,
      },
      trigger: { seconds: 2 },
    });
    Alert.alert('Enviada', 'Recibirás la notificación de prueba en 2 segundos.');
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const markAllRead = () => {
    setHistory(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // ─── Permission banner ─────────────────────────────────────────
  const renderPermBanner = () => {
    if (permStatus === 'granted') {
      return (
        <View style={[nb.banner, { backgroundColor:'#E8F5E9', borderColor:'#C8E6C9' }]}>
          <Text style={[nb.icon]}>✅</Text>
          <View style={{ flex:1 }}>
            <Text style={[nb.title, { color:'#2E7D32' }]}>Notificaciones activas</Text>
            <Text style={[nb.body, { color:'#388E3C' }]}>Tu dispositivo recibirá alertas de TimeFocus.</Text>
          </View>
        </View>
      );
    }
    if (permStatus === 'denied') {
      return (
        <View style={[nb.banner, { backgroundColor:'#FFEBEE', borderColor:'#FFCDD2' }]}>
          <Text style={nb.icon}>🔕</Text>
          <View style={{ flex:1 }}>
            <Text style={[nb.title, { color:C.danger }]}>Notificaciones bloqueadas</Text>
            <Text style={[nb.body, { color:'#C62828' }]}>Ve a Configuración del sistema para habilitarlas.</Text>
          </View>
        </View>
      );
    }
    // undetermined / unknown / unavailable
    return (
      <View style={[nb.banner, { backgroundColor:'#FFF8E1', borderColor:'#FFE082' }]}>
        <Text style={nb.icon}>🔔</Text>
        <View style={{ flex:1 }}>
          <Text style={[nb.title, { color:'#E65100' }]}>Activa las notificaciones</Text>
          <Text style={[nb.body, { color:'#BF360C' }]}>Recibe alertas de pomodoros, tareas y metas.</Text>
        </View>
        <TouchableOpacity style={nb.btn} onPress={requestPermission} disabled={requesting} activeOpacity={0.8}>
          {requesting
            ? <ActivityIndicator size="small" color="#fff"/>
            : <Text style={nb.btnTxt}>Activar</Text>
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={hdr.wrap}>
        <BackIcon onPress={onBack}/>
        <Text style={hdr.title}>Notificaciones</Text>
        <TouchableOpacity style={hdr.markAll} onPress={markAllRead} activeOpacity={0.7}>
          <Text style={hdr.markAllTxt}>Marcar todo ✓</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(40) }}>

        {/* Permission banner */}
        {renderPermBanner()}

        {/* ── Historial ── */}
        <TouchableOpacity style={sec.row} onPress={() => setShowHistory(v=>!v)} activeOpacity={0.8}>
          <Text style={sec.title}>HOY</Text>
          <Text style={sec.chevron}>{showHistory ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showHistory && history.filter(n=>n.unread).map(n => (
          <View key={n.id} style={[nh.card, nh.unread]}>
            <View style={nh.iconWrap}><Text style={nh.icon}>{n.icon}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={nh.title}>{n.title}</Text>
              <Text style={nh.body}>{n.body}</Text>
              <Text style={nh.time}>{n.time}</Text>
            </View>
            <View style={nh.dot}/>
          </View>
        ))}

        <Text style={[sec.title, { marginTop:rv(20) }]}>AYER</Text>
        {history.filter(n=>!n.unread).map(n => (
          <View key={n.id} style={nh.card}>
            <View style={[nh.iconWrap, { backgroundColor:'#F0F0F0' }]}>
              <Text style={nh.icon}>{n.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={[nh.title, { color:C.muted }]}>{n.title}</Text>
              <Text style={nh.body}>{n.body}</Text>
              <Text style={nh.time}>{n.time}</Text>
            </View>
          </View>
        ))}

        {/* ── Configuración por tipo ── */}
        <Text style={[sec.title, { marginTop:rv(24) }]}>CONFIGURACIÓN</Text>

        {NOTIF_GROUPS.map((group, gi) => (
          <View key={gi} style={cfg.card}>
            <Text style={cfg.groupTitle}>{group.title}</Text>
            {group.items.map((item, ii) => (
              <View key={item.key} style={[cfg.row, ii < group.items.length-1 && cfg.rowBorder]}>
                <View style={{ flex:1 }}>
                  <Text style={cfg.label}>{item.label}</Text>
                  <Text style={cfg.desc}>{item.desc}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggleSetting(item.key)}
                  trackColor={{ false: C.border, true: C.success }}
                  thumbColor="#fff"
                  disabled={permStatus !== 'granted'}
                />
              </View>
            ))}
          </View>
        ))}

        {/* ── Test notification button ── */}
        <TouchableOpacity style={test.btn} onPress={sendTestNotification} activeOpacity={0.8}>
          <Text style={test.txt}>🔔  Enviar notificación de prueba</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const hdr = StyleSheet.create({
  wrap:       { flexDirection:'row', alignItems:'center', paddingHorizontal:space.screen,
                paddingTop:rv(10), paddingBottom:rv(8) },
  title:      { fontSize:font.lg, fontWeight:'700', color:C.navy, flex:1, textAlign:'center' },
  markAll:    { paddingHorizontal:8, paddingVertical:4 },
  markAllTxt: { fontSize:font.sm, fontWeight:'600', color:C.navy },
});

const nb = StyleSheet.create({
  banner: { flexDirection:'row', alignItems:'center', gap:12, borderWidth:1,
            borderRadius:radius.lg, padding:rv(14), marginBottom:rv(16) },
  icon:   { fontSize:rs(22) },
  title:  { fontSize:font.sm, fontWeight:'700', marginBottom:2 },
  body:   { fontSize:font.xs, lineHeight:rs(16) },
  btn:    { backgroundColor:C.navy, borderRadius:radius.md, paddingHorizontal:12,
            paddingVertical:8, minWidth:70, alignItems:'center' },
  btnTxt: { color:'#fff', fontWeight:'700', fontSize:font.sm },
});

const sec = StyleSheet.create({
  row:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:rv(10) },
  title:   { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1, marginBottom:rv(8) },
  chevron: { fontSize:font.xs, color:C.muted },
});

const nh = StyleSheet.create({
  card:    { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(14),
             flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:rv(8),
             shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6,
             shadowOffset:{width:0,height:2}, elevation:2 },
  unread:  { backgroundColor:'#FFFBF0', borderLeftWidth:3, borderLeftColor:C.accent },
  iconWrap:{ width:40, height:40, borderRadius:radius.md, backgroundColor:'#FFF3CD',
             alignItems:'center', justifyContent:'center' },
  icon:    { fontSize:rs(18) },
  title:   { fontSize:font.sm, fontWeight:'700', color:C.navy, marginBottom:2 },
  body:    { fontSize:font.xs, color:C.muted, lineHeight:rs(16) },
  time:    { fontSize:font.xs, color:C.muted, marginTop:4 },
  dot:     { width:8, height:8, borderRadius:4, backgroundColor:C.accent, marginTop:6 },
});

const cfg = StyleSheet.create({
  card:       { backgroundColor:C.card, borderRadius:radius.lg, marginBottom:rv(12),
                shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8,
                shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  groupTitle: { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1,
                paddingHorizontal:rv(16), paddingTop:rv(12), paddingBottom:rv(6) },
  row:        { flexDirection:'row', alignItems:'center', paddingHorizontal:rv(16),
                paddingVertical:rv(12), gap:12 },
  rowBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  label:      { fontSize:font.md, fontWeight:'600', color:C.navy, marginBottom:2 },
  desc:       { fontSize:font.xs, color:C.muted },
});

const test = StyleSheet.create({
  btn: { backgroundColor:'#EEF2FF', borderRadius:radius.lg, paddingVertical:rv(14),
         alignItems:'center', marginTop:rv(8) },
  txt: { fontSize:font.md, fontWeight:'700', color:C.navy },
});