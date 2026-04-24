/**
 * ProfileScreen.js — Versión corregida
 * - MiInformacion: EDITABLE (nombre, apellido, teléfono)
 * - MetasEstudio: usuario define sus propias metas + ve progreso real
 * - Permisos: guía al usuario correctamente
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import Svg, { Circle, Path, Line, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { W, rs, rv, font, space, radius } from '../../theme/responsive';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import NotificationsScreen from './NotificationsScreen';
import PrivacyScreen from './PrivacyScreen';

const C = {
  bg: colors.background, card: '#FFFFFF', navy: colors.primary,
  accent: colors.accent, muted: colors.textSecondary,
  border: colors.border, danger: '#FF5252', study: '#3B5BDB', success: colors.success,
};

const IconInfo    = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={C.navy} strokeWidth="1.8"/><Line x1="12" y1="11" x2="12" y2="16" stroke={C.navy} strokeWidth="2" strokeLinecap="round"/><Circle cx="12" cy="8" r="1.2" fill={C.navy}/></Svg>);
const IconTarget  = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={C.navy} strokeWidth="1.8"/><Circle cx="12" cy="12" r="5" stroke={C.accent} strokeWidth="1.8"/><Circle cx="12" cy="12" r="1.5" fill={C.navy}/></Svg>);
const IconBell    = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M18 17H6l1.5-2V11a4.5 4.5 0 019 0v4L18 17z" stroke={C.navy} strokeWidth="1.8" strokeLinejoin="round"/><Path d="M10 17a2 2 0 004 0" stroke={C.navy} strokeWidth="1.8"/></Svg>);
const IconLock    = () => (<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="5" y="11" width="14" height="10" rx="2" stroke={C.navy} strokeWidth="1.8"/><Path d="M8 11V7a4 4 0 018 0v4" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round"/><Circle cx="12" cy="16" r="1.5" fill={C.navy}/></Svg>);
const IconChevron = () => (<Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>);

const BackHeader = ({ title, onBack }) => (
  <View style={bh.wrap}>
    <TouchableOpacity onPress={onBack} style={bh.back} activeOpacity={0.7}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M15 18l-6-6 6-6" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </TouchableOpacity>
    <Text style={bh.title}>{title}</Text>
    <View style={{ width: 40 }}/>
  </View>
);
const bh = StyleSheet.create({
  wrap:  { flexDirection:'row', alignItems:'center', paddingHorizontal:space.screen, paddingTop:rv(10), paddingBottom:rv(8) },
  back:  { width:40, height:40, alignItems:'center', justifyContent:'center', backgroundColor:'#F0F4FF', borderRadius:radius.full },
  title: { fontSize:font.lg, fontWeight:'700', color:C.navy, flex:1, textAlign:'center' },
});

// ══ Sub-screen: Mi información — EDITABLE ══════════════════════════
function MiInformacion({ onBack, user, onUserUpdated }) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [form,    setForm]      = useState({
    nombre:           user?.nombre           || '',
    segundo_nombre:   user?.segundo_nombre   || '',
    apellido_paterno: user?.apellido_paterno || '',
    apellido_materno: user?.apellido_materno || '',
    telefono:         user?.telefono         || '',
  });

  const fullName = [user?.nombre, user?.segundo_nombre, user?.apellido_paterno, user?.apellido_materno].filter(Boolean).join(' ');

  const handleSave = async () => {
    setSaving(true);
    try {
      // Actualizar en el backend
      await api.put('/auth/profile', form);
      // Actualizar en AsyncStorage
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const updated = { ...JSON.parse(stored), ...form };
        await AsyncStorage.setItem('user', JSON.stringify(updated));
        onUserUpdated?.(updated);
      }
      setEditing(false);
      Alert.alert('✅ Guardado', 'Tu información fue actualizada.');
    } catch (e) {
      // Si el endpoint no existe todavía, solo actualizamos localmente
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const updated = { ...JSON.parse(stored), ...form };
        await AsyncStorage.setItem('user', JSON.stringify(updated));
        onUserUpdated?.(updated);
      }
      setEditing(false);
      Alert.alert('✅ Guardado', 'Tu información fue actualizada localmente.');
    } finally { setSaving(false); }
  };

  const FIELDS = [
    { key:'nombre',           label:'Nombre',           placeholder:'Tu nombre' },
    { key:'segundo_nombre',   label:'Segundo nombre',   placeholder:'(opcional)' },
    { key:'apellido_paterno', label:'Apellido paterno',  placeholder:'Apellido paterno' },
    { key:'apellido_materno', label:'Apellido materno',  placeholder:'(opcional)' },
    { key:'telefono',         label:'Teléfono',          placeholder:'Ej: 789 123 4567' },
  ];

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Mi información" onBack={onBack}/>
      <ScrollView contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(40) }} showsVerticalScrollIndicator={false}>

        {/* Campos de solo lectura / email */}
        <View style={mi.card}>
          <View style={[mi.row, mi.rowBorder]}>
            <Text style={mi.label}>Correo</Text>
            <Text style={mi.value}>{user?.email || '—'}</Text>
          </View>
          <View style={mi.row}>
            <Text style={mi.label}>Carrera</Text>
            <Text style={mi.value}>{user?.nombre_carrera || '—'}</Text>
          </View>
        </View>

        {/* Campos editables */}
        {editing ? (
          <View style={mi.card}>
            {FIELDS.map((f, i) => (
              <View key={f.key} style={[mi.row, i < FIELDS.length-1 && mi.rowBorder, { flexDirection:'column', alignItems:'flex-start' }]}>
                <Text style={[mi.label, { marginBottom:4 }]}>{f.label}</Text>
                <TextInput
                  style={mi.editInput}
                  placeholder={f.placeholder}
                  placeholderTextColor="#aaa"
                  value={form[f.key]}
                  onChangeText={t => setForm(p => ({ ...p, [f.key]: t }))}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={mi.card}>
            {[
              { label:'Nombre',    value: fullName || '—' },
              { label:'Teléfono',  value: user?.telefono || '—' },
            ].map((f, i, arr) => (
              <View key={i} style={[mi.row, i < arr.length-1 && mi.rowBorder]}>
                <Text style={mi.label}>{f.label}</Text>
                <Text style={mi.value}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        {editing ? (
          <View style={{ flexDirection:'row', gap:12 }}>
            <TouchableOpacity style={[mi.btn, { flex:1, backgroundColor:'#F5F5F8' }]} onPress={() => setEditing(false)} disabled={saving}>
              <Text style={[mi.btnTxt, { color:C.muted }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[mi.btn, { flex:1, backgroundColor:C.accent }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={C.navy} size="small"/> : <Text style={mi.btnTxt}>Guardar ✓</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={mi.btn} onPress={() => setEditing(true)}>
            <Text style={mi.btnTxt}>✏️  Editar información</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
const mi = StyleSheet.create({
  card:      { backgroundColor:C.card, borderRadius:radius.lg, marginBottom:rv(16), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  row:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:rv(16), paddingVertical:rv(14) },
  rowBorder: { borderBottomWidth:1, borderBottomColor:C.border },
  label:     { fontSize:font.sm, fontWeight:'600', color:C.muted },
  value:     { fontSize:font.md, fontWeight:'600', color:C.navy, flex:1, textAlign:'right' },
  editInput: { borderWidth:1, borderColor:C.border, borderRadius:radius.sm, padding:rs(10), backgroundColor:'#FAFAFA', fontSize:font.md, color:C.navy, width:'100%' },
  btn:       { backgroundColor:C.accent, borderRadius:radius.lg, paddingVertical:rv(14), alignItems:'center', marginBottom:rv(12) },
  btnTxt:    { fontSize:font.md, fontWeight:'700', color:C.navy },
});

// ══ Sub-screen: Metas de estudio — EDITABLES + progreso real ═══════
const GOALS_KEY = 'tf_user_goals';
const DEFAULT_GOALS = { horas_semana: 30, sesiones_semana: 20 };

function MetasEstudio({ onBack }) {
  const [stats,   setStats]   = useState(null);
  const [goals,   setGoals]   = useState(DEFAULT_GOALS);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Cargar metas guardadas
      try {
        const saved = await AsyncStorage.getItem(GOALS_KEY);
        if (saved) { const g = JSON.parse(saved); setGoals(g); setForm(g); }
      } catch(_) {}
      // Cargar stats reales
      try {
        const { data } = await api.get('/sessions/stats');
        setStats(data);
      } catch(_) {}
      setLoading(false);
    };
    init();
  }, []);

  const saveGoals = async () => {
    const parsed = {
      horas_semana:    Math.max(1, parseInt(form.horas_semana)    || DEFAULT_GOALS.horas_semana),
      sesiones_semana: Math.max(1, parseInt(form.sesiones_semana) || DEFAULT_GOALS.sesiones_semana),
    };
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(parsed));
    setGoals(parsed);
    setEditing(false);
  };

  const horasSem   = stats ? Math.round((stats.semana?.minutos_semana || 0) / 60 * 10) / 10 : 0;
  const sesiones   = stats?.semana?.sesiones_semana || 0;
  const total      = stats?.tareas?.total      || 0;
  const completadas= stats?.tareas?.completadas || 0;
  const taskPct    = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const racha      = stats?.racha?.dias_racha || 0;

  const items = [
    { label:'Horas de estudio (semana)',  value:`${horasSem}h`,   icon:'📚', color:C.study,   metaLabel:`Meta: ${goals.horas_semana}h`,     pct: Math.min((horasSem/goals.horas_semana)*100, 100) },
    { label:'Sesiones Pomodoro (semana)', value:String(sesiones),  icon:'🍅', color:'#FF6B35', metaLabel:`Meta: ${goals.sesiones_semana} 🍅`, pct: Math.min((sesiones/goals.sesiones_semana)*100, 100) },
    { label:'Tareas completadas',         value:`${taskPct}%`,     icon:'✅', color:C.success, metaLabel:`${completadas}/${total}`,          pct: taskPct },
    { label:'Días de racha activa',       value:`${racha} 🔥`,    icon:'🔥', color:C.danger,  metaLabel:'Días seguidos',                    pct: Math.min((racha/7)*100, 100) },
  ];

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Metas de estudio" onBack={onBack}/>
      <ScrollView contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(40) }} showsVerticalScrollIndicator={false}>
        <Text style={mt.hint}>Estadísticas reales de tu semana actual.</Text>

        {loading ? (
          <ActivityIndicator color={C.navy} style={{ marginTop:rv(30) }}/>
        ) : items.map((g, i) => (
          <View key={i} style={mt.goalCard}>
            <View style={[mt.goalIcon, { backgroundColor:`${g.color}18` }]}>
              <Text style={{ fontSize:rs(22) }}>{g.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={mt.goalLabel}>{g.label}</Text>
              <Text style={[mt.goalValue, { color:g.color }]}>{g.value}</Text>
              <View style={mt.barBg}>
                <View style={[mt.barFill, { width:`${g.pct}%`, backgroundColor:g.color }]}/>
              </View>
              <Text style={mt.meta}>{g.metaLabel}</Text>
            </View>
          </View>
        ))}

        {/* Sección editar metas */}
        <Text style={[mt.sectionTitle, { marginTop:rv(20) }]}>TUS METAS SEMANALES</Text>

        {editing ? (
          <View style={mt.editCard}>
            <Text style={mt.editLabel}>Horas de estudio por semana</Text>
            <TextInput
              style={mt.editInput}
              keyboardType="numeric"
              value={String(form.horas_semana)}
              onChangeText={t => setForm(p => ({ ...p, horas_semana: t }))}
              placeholderTextColor="#aaa"
            />
            <Text style={mt.editLabel}>Sesiones Pomodoro por semana</Text>
            <TextInput
              style={mt.editInput}
              keyboardType="numeric"
              value={String(form.sesiones_semana)}
              onChangeText={t => setForm(p => ({ ...p, sesiones_semana: t }))}
              placeholderTextColor="#aaa"
            />
            <View style={{ flexDirection:'row', gap:12, marginTop:rv(16) }}>
              <TouchableOpacity style={[mt.btn, { flex:1, backgroundColor:'#F5F5F8' }]} onPress={() => setEditing(false)}>
                <Text style={[mt.btnTxt, { color:C.muted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mt.btn, { flex:1 }]} onPress={saveGoals}>
                <Text style={mt.btnTxt}>Guardar ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={mt.editBtn} onPress={() => setEditing(true)}>
            <Text style={mt.editBtnTxt}>🎯  Personalizar mis metas</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
const mt = StyleSheet.create({
  hint:       { fontSize:font.sm, color:C.muted, marginBottom:rv(16), lineHeight:rs(20) },
  sectionTitle:{ fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1, marginBottom:rv(12) },
  goalCard:   { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(14), flexDirection:'row', alignItems:'center', gap:12, marginBottom:rv(10), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  goalIcon:   { width:48, height:48, borderRadius:radius.md, alignItems:'center', justifyContent:'center' },
  goalLabel:  { fontSize:font.sm, color:C.muted, fontWeight:'600' },
  goalValue:  { fontSize:rs(22), fontWeight:'800', marginTop:2 },
  barBg:      { height:4, borderRadius:99, backgroundColor:'#E8ECF4', marginTop:6, overflow:'hidden' },
  barFill:    { height:'100%', borderRadius:99 },
  meta:       { fontSize:font.xs, color:C.muted, marginTop:3 },
  editCard:   { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), marginBottom:rv(12), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  editLabel:  { fontSize:font.sm, fontWeight:'700', color:C.navy, marginBottom:rv(6), marginTop:rv(12) },
  editInput:  { borderWidth:1, borderColor:C.border, borderRadius:radius.sm, padding:rs(10), backgroundColor:'#FAFAFA', fontSize:font.md, color:C.navy },
  btn:        { backgroundColor:C.accent, borderRadius:radius.md, paddingVertical:rv(12), alignItems:'center' },
  btnTxt:     { fontSize:font.md, fontWeight:'700', color:C.navy },
  editBtn:    { backgroundColor:'#EEF2FF', borderRadius:radius.lg, paddingVertical:rv(14), alignItems:'center', marginBottom:rv(12) },
  editBtnTxt: { fontSize:font.md, fontWeight:'700', color:C.study },
});

// ══ Main ProfileScreen ══════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [subScreen, setSubScreen]     = useState(null);
  const [stats,     setStats]         = useState(null);

  useEffect(() => {
    api.get('/sessions/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (subScreen === 'info')    return <MiInformacion  user={currentUser} onBack={() => setSubScreen(null)} onUserUpdated={u => setCurrentUser(u)}/>;
  if (subScreen === 'metas')   return <MetasEstudio   onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'notif')   return <NotificationsScreen onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'privacy') return <PrivacyScreen  onBack={() => setSubScreen(null)}/>;

  const nombre   = currentUser?.nombre || '';
  const apellido = currentUser?.apellido_paterno || '';
  const fullName = [nombre, apellido].filter(Boolean).join(' ') || 'Usuario';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const carrera  = currentUser?.nombre_carrera || 'Estudiante';

  const horasSem    = stats ? Math.round((stats.semana?.minutos_semana || 0) / 60 * 10) / 10 : '—';
  const sesionesTot = stats?.semana?.sesiones_semana || '—';

  const MENU = [
    { key:'info',    label:'Mi información',     icon:<IconInfo/>   },
    { key:'metas',   label:'Metas de estudio',   icon:<IconTarget/> },
    { key:'notif',   label:'Notificaciones',     icon:<IconBell/>   },
    { key:'privacy', label:'Privacidad y datos', icon:<IconLock/>   },
  ];

  return (
    <SafeAreaView style={ps.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={ps.hero}>
          <View style={ps.avatar}><Text style={ps.avatarTxt}>{initials}</Text></View>
          <Text style={ps.heroName}>{fullName}</Text>
          <Text style={ps.heroSub}>{carrera}</Text>
          <Text style={ps.heroInst}>UTXJ · Xicotepec</Text>
        </View>

        <View style={ps.statsCard}>
          {[
            { value:`${horasSem}h`,                              label:'SEMANA'     },
            { value:String(sesionesTot),                          label:'SESIONES 🍅' },
            { value:`${stats?.tareas?.completadas || 0}`,         label:'TAREAS ✓'   },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={ps.statsDivider}/>}
              <View style={ps.statItem}>
                <Text style={ps.statValue}>{s.value}</Text>
                <Text style={ps.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={ps.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity key={item.key}
              style={[ps.menuRow, i < MENU.length-1 && ps.menuRowBorder]}
              onPress={() => setSubScreen(item.key)} activeOpacity={0.75}>
              <View style={ps.menuIcon}>{item.icon}</View>
              <Text style={ps.menuLabel}>{item.label}</Text>
              <IconChevron/>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={ps.logoutBtn}
          onPress={() => Alert.alert('Cerrar sesión','¿Seguro que quieres salir?',[
            { text:'Cancelar', style:'cancel' },
            { text:'Salir', style:'destructive', onPress: signOut },
          ])} activeOpacity={0.8}>
          <Text style={ps.logoutTxt}>🚪  Cerrar sesión</Text>
        </TouchableOpacity>
        <Text style={ps.version}>TimeFocus v1.0 · UTXJ 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  root:         { flex:1, backgroundColor:C.bg },
  hero:         { backgroundColor:C.navy, paddingTop:rv(32), paddingBottom:rv(60), alignItems:'center' },
  avatar:       { width:rs(80), height:rs(80), borderRadius:rs(40), backgroundColor:C.accent, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:'rgba(255,255,255,0.25)', marginBottom:rv(14) },
  avatarTxt:    { fontSize:rs(32), fontWeight:'900', color:C.navy },
  heroName:     { fontSize:font.xl, fontWeight:'800', color:'#fff', marginBottom:rv(4) },
  heroSub:      { fontSize:font.md, fontWeight:'500', color:'rgba(255,255,255,0.75)' },
  heroInst:     { fontSize:font.sm, color:'rgba(255,255,255,0.5)', marginTop:rv(2) },
  statsCard:    { backgroundColor:C.card, borderRadius:radius.lg, marginHorizontal:space.screen, marginTop:-rv(30), flexDirection:'row', alignItems:'center', paddingVertical:rv(16), paddingHorizontal:rv(8), shadowColor:'#000', shadowOpacity:0.1, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:6, marginBottom:rv(20) },
  statItem:     { flex:1, alignItems:'center' },
  statValue:    { fontSize:rs(22), fontWeight:'900', color:C.navy },
  statLabel:    { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:0.8, marginTop:2 },
  statsDivider: { width:1, height:rv(36), backgroundColor:C.border },
  menuCard:     { backgroundColor:C.card, borderRadius:radius.lg, marginHorizontal:space.screen, marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  menuRow:      { flexDirection:'row', alignItems:'center', paddingHorizontal:rv(16), paddingVertical:rv(15), gap:14 },
  menuRowBorder:{ borderBottomWidth:1, borderBottomColor:C.border },
  menuIcon:     { width:36, height:36, borderRadius:radius.sm, backgroundColor:'#F0F4FF', alignItems:'center', justifyContent:'center' },
  menuLabel:    { flex:1, fontSize:font.md, fontWeight:'600', color:C.navy },
  logoutBtn:    { marginHorizontal:space.screen, borderRadius:radius.lg, paddingVertical:rv(14), alignItems:'center', backgroundColor:'#FFF0F0', marginBottom:rv(10) },
  logoutTxt:    { fontSize:font.md, fontWeight:'700', color:C.danger },
  version:      { textAlign:'center', fontSize:font.xs, color:C.muted, marginBottom:rv(20) },
});
