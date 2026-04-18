/**
 * ProfileScreen.js
 * Pantalla de perfil del usuario con:
 *   - Avatar, nombre, carrera e institución
 *   - Stats rápidas (promedio, horas semana, pomodoros)
 *   - Menú de configuración
 *   - Sub-screens: Mi información, Metas de estudio
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Alert,
} from 'react-native';
import Svg, { Circle, Path, Line, Rect, Polyline } from 'react-native-svg';
import { colors }  from '../../theme/colors';
import { W, rs, rv, font, space, radius } from '../../theme/responsive';
import { useAuth } from '../../context/AuthContext';
import NotificationsScreen from './NotificationsScreen';
import PrivacyScreen from './PrivacyScreen';

const C = {
  bg:     colors.background,
  card:   '#FFFFFF',
  navy:   colors.primary,
  accent: colors.accent,
  muted:  colors.textSecondary,
  border: colors.border,
  danger: '#FF5252',
  study:  '#3B5BDB',
  success:colors.success,
};

// ─── menu icon helpers ──────────────────────────────────────────
const IconInfo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={C.navy} strokeWidth="1.8"/>
    <Line x1="12" y1="11" x2="12" y2="16" stroke={C.navy} strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="12" cy="8" r="1.2" fill={C.navy}/>
  </Svg>
);
const IconTarget = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={C.navy} strokeWidth="1.8"/>
    <Circle cx="12" cy="12" r="5" stroke={C.accent} strokeWidth="1.8"/>
    <Circle cx="12" cy="12" r="1.5" fill={C.navy}/>
  </Svg>
);
const IconBell = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 17H6l1.5-2V11a4.5 4.5 0 019 0v4L18 17z" stroke={C.navy} strokeWidth="1.8" strokeLinejoin="round"/>
    <Path d="M10 17a2 2 0 004 0" stroke={C.navy} strokeWidth="1.8"/>
  </Svg>
);
const IconLock = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={C.navy} strokeWidth="1.8"/>
    <Path d="M8 11V7a4 4 0 018 0v4" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="1.5" fill={C.navy}/>
  </Svg>
);
const IconExport = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v12M8 11l4 4 4-4" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);
const IconChevron = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

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

// ══════════════════════════════════════════════════════
//  Sub-screen: Mi información
// ══════════════════════════════════════════════════════
function MiInformacion({ onBack }) {
  const fields = [
    { label:'Nombre',       value:'Ana García' },
    { label:'Correo',       value:'ana.garcia@utxj.edu.mx' },
    { label:'Carrera',      value:'Desarrollo de Software' },
    { label:'Semestre',     value:'3° Semestre' },
    { label:'Institución',  value:'UTXJ' },
    { label:'Campus',       value:'Xicotepec' },
  ];
  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Mi información" onBack={onBack}/>
      <ScrollView contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(30) }} showsVerticalScrollIndicator={false}>
        <View style={mi.card}>
          {fields.map((f, i) => (
            <View key={i} style={[mi.row, i < fields.length-1 && mi.rowBorder]}>
              <Text style={mi.label}>{f.label}</Text>
              <Text style={mi.value}>{f.value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={mi.editBtn} activeOpacity={0.8}>
          <Text style={mi.editTxt}>✏️  Editar información</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const mi = StyleSheet.create({
  card:    { backgroundColor:C.card, borderRadius:radius.lg, marginBottom:rv(16), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  row:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:rv(16), paddingVertical:rv(14) },
  rowBorder:{ borderBottomWidth:1, borderBottomColor:C.border },
  label:   { fontSize:font.sm, fontWeight:'600', color:C.muted },
  value:   { fontSize:font.md, fontWeight:'600', color:C.navy, flex:1, textAlign:'right' },
  editBtn: { backgroundColor:C.navy, borderRadius:radius.lg, paddingVertical:rv(14), alignItems:'center' },
  editTxt: { fontSize:font.md, fontWeight:'700', color:'#fff' },
});

// ══════════════════════════════════════════════════════
//  Sub-screen: Metas de estudio
// ══════════════════════════════════════════════════════
function MetasEstudio({ onBack }) {
  const [goals, setGoals] = useState([
    { id:1, label:'Horas semanales de estudio', value:'30h', icon:'📚', color:C.study },
    { id:2, label:'Sesiones Pomodoro por día',  value:'6',   icon:'🍅', color:'#FF6B35' },
    { id:3, label:'Tareas completadas por semana', value:'90%', icon:'✅', color:C.success },
    { id:4, label:'Máx. tiempo en redes sociales', value:'1h', icon:'📵', color:C.danger },
  ]);
  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Metas de estudio" onBack={onBack}/>
      <ScrollView contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(30) }} showsVerticalScrollIndicator={false}>
        <Text style={mt.hint}>Personaliza tus metas para recibir alertas y reportes más precisos.</Text>
        {goals.map(g => (
          <View key={g.id} style={mt.goalCard}>
            <View style={[mt.goalIcon, { backgroundColor:`${g.color}18` }]}>
              <Text style={{ fontSize:rs(22) }}>{g.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={mt.goalLabel}>{g.label}</Text>
              <Text style={[mt.goalValue, { color:g.color }]}>{g.value}</Text>
            </View>
            <TouchableOpacity style={mt.editIcon} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round"/>
                <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={mt.addBtn} activeOpacity={0.8}>
          <Text style={mt.addTxt}>＋  Agregar meta personalizada</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const mt = StyleSheet.create({
  hint:     { fontSize:font.sm, color:C.muted, marginBottom:rv(16), lineHeight:rs(20) },
  goalCard: { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(14), flexDirection:'row', alignItems:'center', gap:12, marginBottom:rv(10), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  goalIcon: { width:48, height:48, borderRadius:radius.md, alignItems:'center', justifyContent:'center' },
  goalLabel:{ fontSize:font.sm, color:C.muted, fontWeight:'600' },
  goalValue:{ fontSize:rs(22), fontWeight:'800', marginTop:2 },
  editIcon: { padding:6 },
  addBtn:   { backgroundColor:'#EEF2FF', borderRadius:radius.lg, paddingVertical:rv(14), alignItems:'center', marginTop:rv(6) },
  addTxt:   { fontSize:font.md, fontWeight:'700', color:C.study },
});

// ══════════════════════════════════════════════════════
//  MAIN ProfileScreen
// ══════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [subScreen, setSubScreen] = useState(null);

  if (subScreen === 'info')    return <MiInformacion  onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'metas')   return <MetasEstudio   onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'notif')   return <NotificationsScreen onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'privacy') return <PrivacyScreen  onBack={() => setSubScreen(null)}/>;

  const name     = user?.nombre || 'Ana García';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const carrera  = user?.carrera || 'Desarrollo de Software';
  const semestre = user?.semestre || '3° Sem.';
  const campus   = user?.campus || 'UTXJ · Xicotepec';

  const MENU = [
    { key:'info',    label:'Mi información',    icon:<IconInfo/>,    sub:true },
    { key:'metas',   label:'Metas de estudio',  icon:<IconTarget/>,  sub:true },
    { key:'notif',   label:'Notificaciones',    icon:<IconBell/>,    sub:true },
    { key:'privacy', label:'Privacidad y datos',icon:<IconLock/>,    sub:true },
    { key:'export',  label:'Exportar mis datos',icon:<IconExport/>,  sub:false },
  ];

  const handleMenu = (key) => {
    if (key === 'info')    setSubScreen('info');
    else if (key === 'metas')   setSubScreen('metas');
    else if (key === 'notif')   setSubScreen('notif');
    else if (key === 'privacy') setSubScreen('privacy');
    else if (key === 'export') {
      Alert.alert('Exportar datos', 'Se generará un archivo con tu historial de estudio y tareas.', [
        { text:'Cancelar', style:'cancel' },
        { text:'Exportar', onPress: () => Alert.alert('✅ Listo', 'Tu archivo será enviado a tu correo.') },
      ]);
    }
  };

  return (
    <SafeAreaView style={ps.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy}/>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero header ── */}
        <View style={ps.hero}>
          <View style={ps.avatarWrap}>
            <View style={ps.avatar}>
              <Text style={ps.avatarTxt}>{initials}</Text>
            </View>
          </View>
          <Text style={ps.heroName}>{name}</Text>
          <Text style={ps.heroSub}>{carrera} · {semestre}</Text>
          <Text style={ps.heroInst}>{campus}</Text>
        </View>

        {/* ── Quick stats ── */}
        <View style={ps.statsCard}>
          {[
            { value:'8.7', label:'PROMEDIO' },
            { value:'34h', label:'SEMANA' },
            { value:'24 🍅', label:'TOTAL' },
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

        {/* ── Menu ── */}
        <View style={ps.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[ps.menuRow, i < MENU.length-1 && ps.menuRowBorder]}
              onPress={() => handleMenu(item.key)}
              activeOpacity={0.75}
            >
              <View style={ps.menuIcon}>{item.icon}</View>
              <Text style={ps.menuLabel}>{item.label}</Text>
              <IconChevron/>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={ps.logoutBtn}
          onPress={() => Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
            { text:'Cancelar', style:'cancel' },
            { text:'Salir', style:'destructive', onPress: logout },
          ])}
          activeOpacity={0.8}
        >
          <Text style={ps.logoutTxt}>🚪  Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={ps.version}>TimeFocus v1.0 · UTXJ 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const HERO_HEIGHT = rv(220);

const ps = StyleSheet.create({
  root:          { flex:1, backgroundColor:C.bg },

  hero:          { backgroundColor:C.navy, paddingTop:rv(32), paddingBottom:rv(60),
                   alignItems:'center' },
  avatarWrap:    { marginBottom:rv(14) },
  avatar:        { width:rs(80), height:rs(80), borderRadius:rs(40),
                   backgroundColor:C.accent, alignItems:'center', justifyContent:'center',
                   borderWidth:3, borderColor:'rgba(255,255,255,0.25)' },
  avatarTxt:     { fontSize:rs(32), fontWeight:'900', color:C.navy },
  heroName:      { fontSize:font.xl, fontWeight:'800', color:'#fff', marginBottom:rv(4) },
  heroSub:       { fontSize:font.md, fontWeight:'500', color:'rgba(255,255,255,0.75)' },
  heroInst:      { fontSize:font.sm, color:'rgba(255,255,255,0.5)', marginTop:rv(2) },

  statsCard:     { backgroundColor:C.card, borderRadius:radius.lg, marginHorizontal:space.screen,
                   marginTop:-rv(30), flexDirection:'row', alignItems:'center',
                   paddingVertical:rv(16), paddingHorizontal:rv(8),
                   shadowColor:'#000', shadowOpacity:0.1, shadowRadius:12,
                   shadowOffset:{width:0,height:4}, elevation:6, marginBottom:rv(20) },
  statItem:      { flex:1, alignItems:'center' },
  statValue:     { fontSize:rs(22), fontWeight:'900', color:C.navy },
  statLabel:     { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:0.8, marginTop:2 },
  statsDivider:  { width:1, height:rv(36), backgroundColor:C.border },

  menuCard:      { backgroundColor:C.card, borderRadius:radius.lg, marginHorizontal:space.screen,
                   marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04,
                   shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  menuRow:       { flexDirection:'row', alignItems:'center', paddingHorizontal:rv(16),
                   paddingVertical:rv(15), gap:14 },
  menuRowBorder: { borderBottomWidth:1, borderBottomColor:C.border },
  menuIcon:      { width:36, height:36, borderRadius:radius.sm, backgroundColor:'#F0F4FF',
                   alignItems:'center', justifyContent:'center' },
  menuLabel:     { flex:1, fontSize:font.md, fontWeight:'600', color:C.navy },

  logoutBtn:     { marginHorizontal:space.screen, borderRadius:radius.lg, paddingVertical:rv(14),
                   alignItems:'center', backgroundColor:'#FFF0F0', marginBottom:rv(10) },
  logoutTxt:     { fontSize:font.md, fontWeight:'700', color:C.danger },

  version:       { textAlign:'center', fontSize:font.xs, color:C.muted, marginBottom:rv(20) },
});