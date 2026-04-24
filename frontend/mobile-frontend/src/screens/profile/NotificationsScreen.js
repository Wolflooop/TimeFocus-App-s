/**
 * NotificationsScreen.js
 * - Historial de notificaciones real desde la BD (/api/notifications)
 * - Settings persistidos en AsyncStorage (no se pierden al cerrar la app)
 * - Marcar como leído conectado a la API real
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, SafeAreaView, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { font, space, radius, rv, rs } from '../../theme/responsive';
import api from '../../services/api';

// ─── Try expo-notifications (optional) ──────────────────────────
let Notifications = null;
let Device = null;
try { Notifications = require('expo-notifications'); } catch (_) {}
try { Device = require('expo-device'); }               catch (_) {}

const SETTINGS_KEY = 'tf_notif_settings';

const C = {
  bg: colors.background, card: '#FFFFFF',
  navy: colors.primary, accent: colors.accent,
  muted: colors.textSecondary, border: colors.border,
  success: colors.success, danger: colors.error,
};

const NOTIF_GROUPS = [
  {
    title: 'Pomodoro',
    items: [
      { key: 'pomodoro_end',  label: 'Sesión completada',    desc: 'Alerta al terminar cada pomodoro',       default: true  },
      { key: 'break_end',     label: 'Fin de descanso',      desc: 'Avisa cuando el descanso termina',       default: true  },
      { key: 'daily_goal',    label: 'Meta diaria',          desc: 'Resumen al alcanzar tu meta',            default: true  },
    ],
  },
  {
    title: 'Tareas',
    items: [
      { key: 'task_due',      label: 'Tarea por vencer',     desc: '24h y 1h antes de la fecha límite',      default: true  },
      { key: 'task_reminder', label: 'Recordatorio diario',  desc: 'Lista de tareas pendientes a las 8 AM',  default: false },
    ],
  },
  {
    title: 'Hábitos y bienestar',
    items: [
      { key: 'distraction',   label: 'Alerta de distracción',desc: 'Exceso de tiempo en redes sociales',     default: true  },
      { key: 'weekly_summary',label: 'Resumen semanal',      desc: 'Reporte de productividad cada domingo',  default: true  },
      { key: 'streak',        label: 'Rachas de estudio',    desc: 'Celebra tus días seguidos de estudio',   default: false },
    ],
  },
];

const defaultSettings = () => {
  const map = {};
  NOTIF_GROUPS.forEach(g => g.items.forEach(i => { map[i.key] = i.default; }));
  return map;
};

// Icono según tipo de recordatorio de la BD
const typeIcon = (tipo) => {
  switch (tipo) {
    case 'tarea':    return '📋';
    case 'estudio':  return '🍅';
    case 'evento':   return '📅';
    default:         return '🔔';
  }
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)  return 'Ayer';
  return `Hace ${diffD} días`;
};

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

export default function NotificationsScreen({ onBack }) {
  const [permStatus,  setPermStatus]  = useState('unknown');
  const [requesting,  setRequesting]  = useState(false);
  const [settings,    setSettings]    = useState(defaultSettings());
  const [history,     setHistory]     = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Cargar settings persistidos ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (saved) setSettings(JSON.parse(saved));
      } catch (_) {}
    })();
    checkPermission();
    loadHistory();
  }, []);

  // ── Guardar settings en AsyncStorage cuando cambian ────────────
  const saveSettings = async (next) => {
    setSettings(next);
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (_) {}
  };

  const toggleSetting = (key) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  // ── Cargar historial desde la BD ───────────────────────────────
  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingHist(true);
    try {
      const { data } = await api.get('/notifications');
      setHistory(data);
    } catch (e) {
      // Sin conexión — mostrar vacío, no mock
      console.log('[Notif] Sin conexión:', e.message);
    } finally {
      setLoadingHist(false);
      setRefreshing(false);
    }
  }, []);

  // ── Marcar como leído en la BD ─────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setHistory(prev =>
        prev.map(n => n.id_recordatorio === id ? { ...n, enviado: 1 } : n)
      );
    } catch (_) {}
  };

  const markAllRead = async () => {
    const unread = history.filter(n => !n.enviado);
    await Promise.all(unread.map(n => markAsRead(n.id_recordatorio)));
  };

  // ── Permisos ───────────────────────────────────────────────────
  const checkPermission = async () => {
    if (!Notifications) { setPermStatus('unavailable'); return; }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermStatus(status);
    } catch { setPermStatus('unavailable'); }
  };

  const requestPermission = async () => {
    if (!Notifications) {
      Alert.alert('Info', 'expo-notifications no instalado. Las notificaciones locales no están disponibles en esta build.');
      return;
    }
    if (Device && !Device.isDevice) {
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
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
          }),
        });
      } else {
        Alert.alert('Sin permiso', 'Ve a Configuración del sistema para habilitar las notificaciones de TimeFocus.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRequesting(false);
    }
  };

  const sendTestNotification = async () => {
    if (!Notifications || permStatus !== 'granted') {
      Alert.alert('Prueba', '🍅 Notificación de prueba (permiso no activo en este dispositivo)');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: '🍅 TimeFocus', body: '¡Las notificaciones están funcionando!', sound: true },
      trigger: { seconds: 2 },
    });
    Alert.alert('Enviada', 'Recibirás la notificación en 2 segundos.');
  };

  // ── Permission banner ──────────────────────────────────────────
  const renderBanner = () => {
    if (permStatus === 'granted') {
      return (
        <View style={[nb.banner, { backgroundColor:'#E8F5E9', borderColor:'#C8E6C9' }]}>
          <Text style={nb.icon}>✅</Text>
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

  const unread = history.filter(n => !n.enviado);
  const read   = history.filter(n => n.enviado);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={hdr.wrap}>
        <BackIcon onPress={onBack}/>
        <Text style={hdr.title}>Notificaciones</Text>
        {unread.length > 0
          ? <TouchableOpacity style={hdr.markAll} onPress={markAllRead} activeOpacity={0.7}>
              <Text style={hdr.markAllTxt}>Marcar todo ✓</Text>
            </TouchableOpacity>
          : <View style={{ width: 80 }}/>
        }
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={C.navy}/>}>

        {renderBanner()}

        {/* Historial real de la BD */}
        <Text style={sec.title}>HISTORIAL</Text>

        {loadingHist ? (
          <ActivityIndicator color={C.navy} style={{ marginVertical: rv(20) }}/>
        ) : history.length === 0 ? (
          <View style={empty.wrap}>
            <Text style={empty.icon}>🔔</Text>
            <Text style={empty.txt}>No tienes notificaciones aún</Text>
          </View>
        ) : (
          <>
            {unread.map(n => (
              <TouchableOpacity
                key={n.id_recordatorio}
                style={[nh.card, nh.unread]}
                onPress={() => markAsRead(n.id_recordatorio)}
                activeOpacity={0.8}>
                <View style={nh.iconWrap}>
                  <Text style={nh.icon}>{typeIcon(n.tipo)}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={nh.title}>{n.mensaje}</Text>
                  <Text style={nh.time}>{fmtDate(n.fecha_hora_envio)}</Text>
                </View>
                <View style={nh.dot}/>
              </TouchableOpacity>
            ))}

            {read.length > 0 && (
              <>
                <Text style={[sec.title, { marginTop:rv(16) }]}>ANTERIORES</Text>
                {read.slice(0, 10).map(n => (
                  <View key={n.id_recordatorio} style={nh.card}>
                    <View style={[nh.iconWrap, { backgroundColor:'#F0F0F0' }]}>
                      <Text style={nh.icon}>{typeIcon(n.tipo)}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[nh.title, { color:C.muted }]}>{n.mensaje}</Text>
                      <Text style={nh.time}>{fmtDate(n.fecha_hora_envio)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* Configuración persistida */}
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
                  value={!!settings[item.key]}
                  onValueChange={() => toggleSetting(item.key)}
                  trackColor={{ false: C.border, true: C.success }}
                  thumbColor="#fff"
                  disabled={permStatus !== 'granted' && permStatus !== 'unavailable'}
                />
              </View>
            ))}
          </View>
        ))}

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
  title: { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1, marginBottom:rv(8) },
});
const empty = StyleSheet.create({
  wrap: { alignItems:'center', paddingVertical:rv(30) },
  icon: { fontSize:rs(36), marginBottom:rv(8) },
  txt:  { fontSize:font.md, color:C.muted, fontWeight:'500' },
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
  title:   { fontSize:font.sm, fontWeight:'600', color:C.navy, marginBottom:2 },
  time:    { fontSize:font.xs, color:C.muted },
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