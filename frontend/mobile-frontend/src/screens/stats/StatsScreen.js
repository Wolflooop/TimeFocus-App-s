/**
 * StatsScreen.js
 * Estadisticas conectadas a la API real:
 *   Tab 0 - Habitos TimeFocus (datos de BD)
 *   Tab 1 - Uso del dispositivo (mock — requiere PACKAGE_USAGE_STATS)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { W, rs, rv, font, space, radius } from '../../theme/responsive';
import api from '../../services/api';

const C = {
  study:   '#3B5BDB',
  social:  '#F59F00',
  other:   '#FF5252',
  bg:      colors.background,
  card:    '#FFFFFF',
  navy:    colors.primary,
  accent:  colors.accent,
  muted:   colors.textSecondary,
  success: colors.success,
  border:  colors.border,
};

const fmtMin = (m) => {
  const min = Math.round(m || 0);
  const h = Math.floor(min / 60);
  const r = min % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
};

const DAY_LABELS = ['L','M','X','J','V','S','D'];

// ── BackHeader ──────────────────────────────────────────────────
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
  wrap:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:space.screen, paddingTop:rv(10), paddingBottom:rv(8) },
  back:  { width:40, height:40, alignItems:'center', justifyContent:'center', backgroundColor:'#F0F4FF', borderRadius:radius.full },
  title: { fontSize:font.lg, fontWeight:'700', color:C.navy, flex:1, textAlign:'center' },
});

// ══════════════════════════════════════════════════════
//  VIEW 1 — HABITOS TIMEFOCUS (datos reales)
// ══════════════════════════════════════════════════════
function HabitsView({ onRefresh }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data: d } = await api.get('/sessions/stats');
      setData(d);
    } catch (e) {
      console.log('[Stats] Error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={C.navy} size="large"/>
      </View>
    );
  }

  // Convertir porDia a array de 7 posiciones (L=2, M=3, X=4, J=5, V=6, S=7, D=1)
  const barData = [2, 3, 4, 5, 6, 7, 1].map(dow => {
    const found = (data?.porDia || []).find(r => r.dia === dow);
    return found ? Math.round(found.minutos / 60 * 10) / 10 : 0;
  });
  const maxBar       = Math.max(...barData, 1);
  const minutosHoy   = data?.hoy?.minutos_hoy   || 0;
  const sesionesHoy  = data?.hoy?.sesiones_hoy  || 0;
  const minutosSem   = data?.semana?.minutos_semana  || 0;
  const sesionesSem  = data?.semana?.sesiones_semana || 0;
  const horasSem     = Math.round(minutosSem / 60 * 10) / 10;
  const totalTareas  = data?.tareas?.total       || 0;
  const completadas  = data?.tareas?.completadas || 0;
  const taskPct      = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;
  const diasRacha    = data?.racha?.dias_racha   || 0;
  const avgPerDay    = sesionesSem > 0 ? Math.round(minutosSem / 7 / 60 * 10) / 10 : 0;

  return (
    <ScrollView
      style={{ flex:1 }}
      contentContainerStyle={hv.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.navy}/>}>

      {/* Tarjeta de hoy */}
      <View style={hv.heroCard}>
        <Text style={hv.heroLabel}>HOY</Text>
        <Text style={hv.heroTime}>{fmtMin(minutosHoy)}</Text>
        <Text style={hv.heroSub}>{sesionesHoy} sesión{sesionesHoy !== 1 ? 'es' : ''} Pomodoro completada{sesionesHoy !== 1 ? 's' : ''}</Text>
      </View>

      {/* Tarjeta de semana con grafica */}
      <View style={hv.weekCard}>
        <Text style={hv.cardTitle}>HORAS DE ESTUDIO · ESTA SEMANA</Text>
        <Text style={hv.weekBig}>{horasSem}<Text style={hv.weekUnit}>h</Text></Text>
        <View style={hv.chart}>
          {barData.map((v, i) => {
            const h = Math.max((v / maxBar) * rv(60), rv(4));
            const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            return (
              <View key={i} style={hv.barCol}>
                <View style={[hv.bar, { height: h, backgroundColor: isToday ? C.accent : 'rgba(255,255,255,0.3)' }]}/>
                <Text style={hv.dayLbl}>{DAY_LABELS[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats grid */}
      <View style={hv.grid}>
        {[
          { num: sesionesSem,   label: 'Sesiones 🍅',   color: C.navy },
          { num: `${taskPct}%`, label: 'Tareas ✓',      color: C.success },
          { num: `${avgPerDay}h`, label: 'Promedio/día', color: C.social },
          { num: `${diasRacha}🔥`, label: 'Días activos', color: C.other },
        ].map((s, i) => (
          <View key={i} style={hv.statCard}>
            <Text style={[hv.statNum, { color: s.color }]}>{s.num}</Text>
            <Text style={hv.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Meta semanal */}
      <View style={hv.goalCard}>
        <View style={hv.goalHeader}>
          <Text style={hv.goalTitle}>Meta semanal (30h)</Text>
          <Text style={[hv.goalPct, { color: C.success }]}>{Math.min(Math.round((horasSem / 30) * 100), 100)}%</Text>
        </View>
        <View style={hv.goalBarBg}>
          <View style={[hv.goalBarFill, { width: `${Math.min((horasSem / 30) * 100, 100)}%` }]}/>
        </View>
        <Text style={hv.goalNote}>{horasSem}h de 30h objetivo</Text>
      </View>

      {/* Tareas */}
      <View style={hv.goalCard}>
        <View style={hv.goalHeader}>
          <Text style={hv.goalTitle}>Tareas completadas</Text>
          <Text style={[hv.goalPct, { color: C.study }]}>{completadas}/{totalTareas}</Text>
        </View>
        <View style={hv.goalBarBg}>
          <View style={[hv.goalBarFill, { width: `${taskPct}%`, backgroundColor: C.study }]}/>
        </View>
        <Text style={hv.goalNote}>{taskPct}% de tareas resueltas</Text>
      </View>
    </ScrollView>
  );
}

const hv = StyleSheet.create({
  scroll:       { paddingHorizontal:space.screen, paddingBottom:rv(30), paddingTop:rv(4) },
  heroCard:     { backgroundColor:C.navy, borderRadius:radius.lg, padding:rv(18), marginBottom:rv(14) },
  heroLabel:    { fontSize:font.xs, fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:1, marginBottom:rv(4) },
  heroTime:     { fontSize:rs(44), fontWeight:'800', color:'#fff', letterSpacing:-2 },
  heroSub:      { fontSize:font.sm, color:'rgba(255,255,255,0.65)', marginTop:rv(4) },
  weekCard:     { backgroundColor:C.navy, borderRadius:radius.lg, padding:rv(18), marginBottom:rv(14) },
  cardTitle:    { fontSize:font.xs, fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:1, marginBottom:rv(4) },
  weekBig:      { fontSize:rs(42), fontWeight:'800', color:'#fff', letterSpacing:-2 },
  weekUnit:     { fontSize:rs(26), fontWeight:'700' },
  chart:        { flexDirection:'row', alignItems:'flex-end', height:rv(80), gap:6, marginTop:rv(12) },
  barCol:       { flex:1, alignItems:'center', justifyContent:'flex-end', gap:6 },
  bar:          { width:'70%', borderRadius:4, minHeight:rv(4) },
  dayLbl:       { fontSize:font.xs, color:'rgba(255,255,255,0.5)', fontWeight:'600' },
  grid:         { flexDirection:'row', flexWrap:'wrap', gap:rv(10), marginBottom:rv(14) },
  statCard:     { flex:1, minWidth:(W-space.screen*2-rv(10))/2-1, backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), alignItems:'center', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  statNum:      { fontSize:rs(28), fontWeight:'800' },
  statLabel:    { fontSize:font.sm, color:C.muted, fontWeight:'500', marginTop:2 },
  goalCard:     { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  goalHeader:   { flexDirection:'row', justifyContent:'space-between', marginBottom:rv(10) },
  goalTitle:    { fontSize:font.md, fontWeight:'700', color:C.navy },
  goalPct:      { fontSize:font.md, fontWeight:'800' },
  goalBarBg:    { height:rv(10), borderRadius:99, backgroundColor:'#E8ECF4', overflow:'hidden', marginBottom:rv(6) },
  goalBarFill:  { height:'100%', borderRadius:99, backgroundColor:C.success },
  goalNote:     { fontSize:font.sm, color:C.muted },
});

// ══════════════════════════════════════════════════════
//  VIEW 2 — USO DEL DISPOSITIVO (placeholder hasta tener permiso)
// ══════════════════════════════════════════════════════
function DeviceUsageView() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal:space.screen, paddingTop:rv(20), paddingBottom:rv(30) }}>
      <View style={du.infoCard}>
        <Text style={du.infoIcon}>📱</Text>
        <Text style={du.infoTitle}>Uso de aplicaciones</Text>
        <Text style={du.infoText}>
          Para mostrar cuanto tiempo usas cada app, TimeFocus necesita el permiso
          de "Acceso al uso de aplicaciones" (PACKAGE_USAGE_STATS).
        </Text>
        <Text style={du.infoText}>
          Ve a Ajustes del telefono → Aplicaciones → Acceso especial → Uso de datos
          y activa el permiso para TimeFocus.
        </Text>
        <View style={du.note}>
          <Text style={du.noteTxt}>Esta funcion estara disponible en la proxima version.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const du = StyleSheet.create({
  infoCard:  { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(24), alignItems:'center', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  infoIcon:  { fontSize:rs(48), marginBottom:rv(12) },
  infoTitle: { fontSize:font.xl, fontWeight:'800', color:C.navy, marginBottom:rv(12) },
  infoText:  { fontSize:font.md, color:C.muted, textAlign:'center', lineHeight:rs(22), marginBottom:rv(12) },
  note:      { backgroundColor:'#EEF2FF', borderRadius:radius.md, padding:rv(12), marginTop:rv(8) },
  noteTxt:   { fontSize:font.sm, color:C.study, fontWeight:'600', textAlign:'center' },
});

// ══════════════════════════════════════════════════════
//  MAIN StatsScreen
// ══════════════════════════════════════════════════════
export default function StatsScreen() {
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={ms.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <View style={ms.header}>
        <Text style={ms.headerTitle}>Estadísticas</Text>
      </View>
      <View style={ms.tabBar}>
        {[{ label:'🎯 Hábitos', i:0 }, { label:'📱 Dispositivo', i:1 }].map(({ label, i }) => (
          <TouchableOpacity key={i} style={[ms.mainTab, tab===i && ms.mainTabActive]}
            onPress={() => setTab(i)} activeOpacity={0.8}>
            <Text style={[ms.mainTabTxt, tab===i && ms.mainTabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex:1 }}>
        {tab === 0 ? <HabitsView/> : <DeviceUsageView/>}
      </View>
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  root:             { flex:1, backgroundColor:C.bg },
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:space.screen, paddingTop:rv(12), paddingBottom:rv(8) },
  headerTitle:      { fontSize:font.xxl, fontWeight:'800', color:C.navy },
  tabBar:           { flexDirection:'row', marginHorizontal:space.screen, marginBottom:rv(14), backgroundColor:'#E8ECF4', borderRadius:radius.md, padding:4 },
  mainTab:          { flex:1, paddingVertical:rv(9), alignItems:'center', borderRadius:radius.sm-2 },
  mainTabActive:    { backgroundColor:C.navy, shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:3 },
  mainTabTxt:       { fontSize:font.md, fontWeight:'600', color:C.muted },
  mainTabTxtActive: { color:'#fff' },
});
