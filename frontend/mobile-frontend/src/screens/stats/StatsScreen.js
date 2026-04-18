/**
 * StatsScreen.js
 * Pantalla de estadísticas con 4 vistas:
 *   1. Uso del dispositivo  (tab 0)
 *   2. Hábitos TimeFocus    (tab 1)
 *   Sub-screens:
 *   3. Correlación de hábitos
 *   4. Reporte semanal
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors }  from '../../theme/colors';
import { W, rs, rv, clamp, font, space, radius } from '../../theme/responsive';

// ─── palette extra ──────────────────────────────────────────────
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

// ─── mock data ──────────────────────────────────────────────────
const DEVICE_TODAY = {
  totalMin: 443,
  studyMin: 228,
  socialMin: 175,
  otherMin: 40,
  topApps: [
    { name: 'Apuntes & PDF', icon: '📚', min: 132, color: C.study  },
    { name: 'TikTok',        icon: '🎵', min: 90,  color: C.social },
    { name: 'WhatsApp',      icon: '💬', min: 65,  color: '#25D366' },
  ],
};

const HABITS_WEEK = {
  totalHours: 24.3,
  changeVs: 12,
  barData: [2.1, 3.5, 5.8, 2.9, 3.6, 3.2, 3.2],
  sessions: 42,
  tasksPct: 87,
  avgPerDay: 4.5,
  streak: 5,
};

const CORRELATION = {
  insight: 'Con más de 4h/día de estudio, tu promedio sube a 8.9. Con más de 2h en TikTok, baja a 7.1.',
  weeks: [
    { label: 'Sem. 1', hours: 28, grade: 9.1 },
    { label: 'Sem. 2', hours: 24, grade: 8.4 },
    { label: 'Sem. 3', hours: 18, grade: 7.3 },
    { label: 'Sem. 4', hours: 13, grade: 6.5 },
  ],
  heatmap: [
    [0.2, 0.3, 0.5, 0.4, 0.3, 0.5, 0.6],
    [0.3, 0.5, 0.7, 0.8, 0.9, 0.9, 0.9],
  ],
};

const REPORT = {
  score: 78,
  scoreDelta: 5,
  dateRange: 'Sem. 10–16 Feb',
  studyH: 34, studyM: 12,
  leisureH: 12, leisureM: 40,
  tasksOk: 14, tasksTotal: 18,
  pomodoros: 24,
  recommendations: [
    { icon: '✅', text: 'Reduce TikTok a máx. 45 min/día' },
    { icon: '⚠️', text: 'Módulo Desarrollo web pendiente al 28 Feb' },
    { icon: '💡', text: 'Tu mejor hora es 8–10 AM. Programa ahí.' },
  ],
};

const fmtMin = (m) => { const h = Math.floor(m/60); const min = m%60; return h>0?`${h}h ${min}m`:`${min}m`; };
const DAY_LABELS = ['L','M','X','J','V','S','D'];

// ─── BackHeader ─────────────────────────────────────────────────
const BackHeader = ({ title, onBack, rightLabel, onRight }) => (
  <View style={bh.wrap}>
    <TouchableOpacity onPress={onBack} style={bh.back} activeOpacity={0.7}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M15 18l-6-6 6-6" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </TouchableOpacity>
    <Text style={bh.title}>{title}</Text>
    {onRight
      ? <TouchableOpacity onPress={onRight} style={bh.right} activeOpacity={0.7}>
          <Text style={bh.rightTxt}>{rightLabel}</Text>
        </TouchableOpacity>
      : <View style={{ width: 40 }}/>
    }
  </View>
);
const bh = StyleSheet.create({
  wrap:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:space.screen, paddingTop:rv(10), paddingBottom:rv(8) },
  back:    { width:40, height:40, alignItems:'center', justifyContent:'center', backgroundColor:'#F0F4FF', borderRadius:radius.full },
  title:   { fontSize:font.lg, fontWeight:'700', color:C.navy, flex:1, textAlign:'center' },
  right:   { width:60, alignItems:'flex-end' },
  rightTxt:{ fontSize:font.sm, fontWeight:'600', color:C.study },
});

// ══════════════════════════════════════════════════════
//  VIEW 1 — USO DEL DISPOSITIVO
// ══════════════════════════════════════════════════════
function DeviceUsageView() {
  const [period, setPeriod] = useState('hoy');
  const d = DEVICE_TODAY;
  const total = d.studyMin + d.socialMin + d.otherMin;

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={dv.scroll} showsVerticalScrollIndicator={false}>
      <View style={dv.toggle}>
        {['hoy','semana'].map(k => (
          <TouchableOpacity key={k} style={[dv.pill, period===k && dv.pillActive]} onPress={() => setPeriod(k)} activeOpacity={0.75}>
            <Text style={[dv.pillTxt, period===k && dv.pillTxtActive]}>{k==='hoy'?'Hoy':'Semana'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={dv.totalCard}>
        <Text style={dv.cardLabel}>TIEMPO TOTAL EN PANTALLA</Text>
        <Text style={dv.totalTime}>{fmtMin(d.totalMin)}</Text>
        <Text style={dv.totalSub}>↑ 48m más que tu promedio</Text>
      </View>

      <View style={dv.card}>
        <Text style={dv.cardTitle}>Académico vs Ocio digital</Text>
        <View style={dv.barRow}>
          <View style={[dv.barSeg, { flex:d.studyMin, backgroundColor:C.study, borderTopLeftRadius:6, borderBottomLeftRadius:6 }]}/>
          <View style={[dv.barSeg, { flex:d.socialMin, backgroundColor:C.social }]}/>
          <View style={[dv.barSeg, { flex:d.otherMin, backgroundColor:C.other, borderTopRightRadius:6, borderBottomRightRadius:6 }]}/>
        </View>
        <View style={dv.legendRow}>
          {[
            { label:`Estudio ${fmtMin(d.studyMin)}`, color:C.study },
            { label:`Social ${fmtMin(d.socialMin)}`, color:C.social },
            { label:`Otro ${fmtMin(d.otherMin)}`,    color:C.other },
          ].map((l,i) => (
            <View key={i} style={dv.legendItem}>
              <View style={[dv.dot, { backgroundColor:l.color }]}/>
              <Text style={dv.legendTxt}>{l.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={dv.card}>
        <Text style={dv.cardTitle}>Top aplicaciones</Text>
        {d.topApps.map((app, i) => {
          const pct = app.min / d.totalMin;
          return (
            <View key={i} style={dv.appRow}>
              <View style={dv.appIcon}><Text style={{ fontSize:rs(20) }}>{app.icon}</Text></View>
              <View style={{ flex:1 }}>
                <View style={dv.appMeta}>
                  <Text style={dv.appName}>{app.name}</Text>
                  <Text style={[dv.appTime, { color:app.color }]}>{fmtMin(app.min)}</Text>
                </View>
                <View style={dv.appBarBg}>
                  <View style={[dv.appBarFill, { width:`${pct*100}%`, backgroundColor:app.color }]}/>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={dv.ratioCard}>
        <View style={dv.ratioItem}>
          <Text style={[dv.ratioBig, { color:C.study }]}>{Math.round(d.studyMin/total*100)}%</Text>
          <Text style={dv.ratioLabel}>Productivo</Text>
        </View>
        <View style={dv.ratioDivider}/>
        <View style={dv.ratioItem}>
          <Text style={[dv.ratioBig, { color:C.other }]}>{Math.round((d.socialMin+d.otherMin)/total*100)}%</Text>
          <Text style={dv.ratioLabel}>Ocio digital</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const dv = StyleSheet.create({
  scroll:       { paddingHorizontal:space.screen, paddingBottom:rv(30) },
  toggle:       { flexDirection:'row', alignSelf:'flex-end', backgroundColor:'#E8ECF4', borderRadius:radius.full, padding:3, marginBottom:rv(14) },
  pill:         { paddingVertical:5, paddingHorizontal:16, borderRadius:radius.full },
  pillActive:   { backgroundColor:C.navy },
  pillTxt:      { fontSize:font.sm, fontWeight:'600', color:C.muted },
  pillTxtActive:{ color:'#fff' },
  totalCard:    { backgroundColor:C.navy, borderRadius:radius.lg, padding:rv(18), marginBottom:rv(14) },
  cardLabel:    { fontSize:font.xs, fontWeight:'700', color:'rgba(255,255,255,0.55)', letterSpacing:1, marginBottom:rv(6) },
  totalTime:    { fontSize:rs(42), fontWeight:'800', color:'#fff', letterSpacing:-1 },
  totalSub:     { fontSize:font.sm, color:'rgba(255,255,255,0.65)', marginTop:rv(4) },
  card:         { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  cardTitle:    { fontSize:font.md, fontWeight:'700', color:C.navy, marginBottom:rv(12) },
  barRow:       { flexDirection:'row', height:rv(18), borderRadius:6, overflow:'hidden', marginBottom:rv(10) },
  barSeg:       {},
  legendRow:    { flexDirection:'row', gap:12, flexWrap:'wrap' },
  legendItem:   { flexDirection:'row', alignItems:'center', gap:5 },
  dot:          { width:9, height:9, borderRadius:99 },
  legendTxt:    { fontSize:font.sm, color:C.navy, fontWeight:'500' },
  appRow:       { flexDirection:'row', alignItems:'center', marginBottom:rv(12), gap:10 },
  appIcon:      { width:36, height:36, borderRadius:10, backgroundColor:'#F0F4FF', alignItems:'center', justifyContent:'center' },
  appMeta:      { flexDirection:'row', justifyContent:'space-between', marginBottom:rv(4) },
  appName:      { fontSize:font.md, fontWeight:'600', color:C.navy },
  appTime:      { fontSize:font.md, fontWeight:'700' },
  appBarBg:     { height:rv(5), borderRadius:99, backgroundColor:'#EEF2FF', overflow:'hidden' },
  appBarFill:   { height:'100%', borderRadius:99 },
  ratioCard:    { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), flexDirection:'row', alignItems:'center', marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  ratioItem:    { flex:1, alignItems:'center' },
  ratioBig:     { fontSize:rs(30), fontWeight:'800' },
  ratioLabel:   { fontSize:font.sm, color:C.muted, fontWeight:'500', marginTop:2 },
  ratioDivider: { width:1, height:rv(44), backgroundColor:C.border },
});

// ══════════════════════════════════════════════════════
//  VIEW 2 — HÁBITOS TIMEFOCUS
// ══════════════════════════════════════════════════════
function HabitsView({ onCorrelation }) {
  const d = HABITS_WEEK;
  const maxBar = Math.max(...d.barData);

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={hv.scroll} showsVerticalScrollIndicator={false}>
      <View style={hv.tabs}>
        {['Semana','Mes','Semestre'].map((t, i) => (
          <TouchableOpacity key={i} style={[hv.tab, i===0 && hv.tabActive]} activeOpacity={0.75}>
            <Text style={[hv.tabTxt, i===0 && hv.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={hv.heroCard}>
        <Text style={hv.heroLabel}>HORAS DE ESTUDIO · ESTA SEMANA</Text>
        <Text style={hv.heroTime}>{d.totalHours}<Text style={hv.heroUnit}>h</Text></Text>
        <Text style={hv.heroSub}>↑ {d.changeVs}% vs semana pasada</Text>
        <View style={hv.chart}>
          {d.barData.map((v, i) => {
            const h = Math.max((v / maxBar) * rv(72), rv(8));
            const isToday = i === 2;
            return (
              <View key={i} style={hv.barCol}>
                <View style={[hv.bar, { height:h, backgroundColor:isToday?C.accent:'rgba(255,255,255,0.25)' }]}/>
                <Text style={hv.dayLbl}>{DAY_LABELS[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={hv.grid}>
        {[
          { num: d.sessions,  label:'Sesiones 🍅',  color:C.navy },
          { num:`${d.tasksPct}%`, label:'Tareas ✓', color:C.success },
          { num:`${d.avgPerDay}h`, label:'Promedio/día', color:C.social },
          { num:`${d.streak}🔥`,  label:'Días racha',   color:C.other },
        ].map((s, i) => (
          <View key={i} style={hv.statCard}>
            <Text style={[hv.statNum, { color:s.color }]}>{s.num}</Text>
            <Text style={hv.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={hv.corrBtn} onPress={onCorrelation} activeOpacity={0.8}>
        <View style={hv.corrLeft}>
          <Text style={{ fontSize:rs(22) }}>🔗</Text>
          <View>
            <Text style={hv.corrTitle}>Correlación de hábitos</Text>
            <Text style={hv.corrSub}>Estudio vs calificaciones y distracciones</Text>
          </View>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke={C.study} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      </TouchableOpacity>

      <View style={hv.goalCard}>
        <View style={hv.goalHeader}>
          <Text style={hv.goalTitle}>Meta semanal</Text>
          <Text style={[hv.goalPct, { color:C.success }]}>81%</Text>
        </View>
        <View style={hv.goalBarBg}>
          <View style={[hv.goalBarFill, { width:'81%' }]}/>
        </View>
        <Text style={hv.goalNote}>{d.totalHours}h de 30h objetivo</Text>
      </View>
    </ScrollView>
  );
}

const hv = StyleSheet.create({
  scroll:       { paddingHorizontal:space.screen, paddingBottom:rv(30) },
  tabs:         { flexDirection:'row', backgroundColor:'#E8ECF4', borderRadius:radius.full, padding:3, marginBottom:rv(14), alignSelf:'flex-start' },
  tab:          { paddingVertical:5, paddingHorizontal:16, borderRadius:radius.full },
  tabActive:    { backgroundColor:C.navy },
  tabTxt:       { fontSize:font.sm, fontWeight:'600', color:C.muted },
  tabTxtActive: { color:'#fff' },
  heroCard:     { backgroundColor:C.navy, borderRadius:radius.lg, padding:rv(18), marginBottom:rv(14) },
  heroLabel:    { fontSize:font.xs, fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:1, marginBottom:rv(4) },
  heroTime:     { fontSize:rs(48), fontWeight:'800', color:'#fff', letterSpacing:-2 },
  heroUnit:     { fontSize:rs(28), fontWeight:'700' },
  heroSub:      { fontSize:font.sm, color:C.accent, fontWeight:'600', marginBottom:rv(16) },
  chart:        { flexDirection:'row', alignItems:'flex-end', height:rv(90), gap:6 },
  barCol:       { flex:1, alignItems:'center', justifyContent:'flex-end', gap:6 },
  bar:          { width:'70%', borderRadius:4, minHeight:rv(8) },
  dayLbl:       { fontSize:font.xs, color:'rgba(255,255,255,0.5)', fontWeight:'600' },
  grid:         { flexDirection:'row', flexWrap:'wrap', gap:rv(10), marginBottom:rv(14) },
  statCard:     { flex:1, minWidth:(W-space.screen*2-rv(10))/2-1, backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), alignItems:'center', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  statNum:      { fontSize:rs(28), fontWeight:'800' },
  statLabel:    { fontSize:font.sm, color:C.muted, fontWeight:'500', marginTop:2 },
  corrBtn:      { backgroundColor:'#EEF2FF', borderRadius:radius.lg, padding:rv(14), flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:rv(14) },
  corrLeft:     { flexDirection:'row', alignItems:'center', gap:12 },
  corrTitle:    { fontSize:font.md, fontWeight:'700', color:C.navy },
  corrSub:      { fontSize:font.sm, color:C.muted, marginTop:2 },
  goalCard:     { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  goalHeader:   { flexDirection:'row', justifyContent:'space-between', marginBottom:rv(10) },
  goalTitle:    { fontSize:font.md, fontWeight:'700', color:C.navy },
  goalPct:      { fontSize:font.md, fontWeight:'800' },
  goalBarBg:    { height:rv(10), borderRadius:99, backgroundColor:'#E8ECF4', overflow:'hidden', marginBottom:rv(6) },
  goalBarFill:  { height:'100%', borderRadius:99, backgroundColor:C.success },
  goalNote:     { fontSize:font.sm, color:C.muted },
});

// ══════════════════════════════════════════════════════
//  SUB-SCREEN 3 — CORRELACIÓN DE HÁBITOS
// ══════════════════════════════════════════════════════
function CorrelationScreen({ onBack }) {
  const d = CORRELATION;
  const maxHours = Math.max(...d.weeks.map(w => w.hours));
  const weekColors = [C.success, C.study, C.social, C.other];

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Correlación de hábitos" onBack={onBack}/>
      <ScrollView contentContainerStyle={cs.scroll} showsVerticalScrollIndicator={false}>
        <View style={cs.insight}>
          <Text style={{ fontSize:rs(18) }}>💡</Text>
          <Text style={cs.insightTxt}>
            <Text style={{ fontWeight:'700' }}>Insight: </Text>
            {d.insight}
          </Text>
        </View>

        <View style={cs.card}>
          <Text style={cs.cardTitle}>HORAS ESTUDIO VS CALIFICACIÓN</Text>
          {d.weeks.map((w, i) => (
            <View key={i} style={cs.weekRow}>
              <Text style={cs.weekLabel}>{w.label}</Text>
              <View style={cs.weekBarBg}>
                <View style={[cs.weekBarFill, { width:`${(w.hours/maxHours)*100}%`, backgroundColor:weekColors[i] }]}/>
              </View>
              <Text style={[cs.weekStat, { color:weekColors[i] }]}>{w.hours}h · <Text style={cs.weekGrade}>{w.grade}</Text></Text>
            </View>
          ))}
        </View>

        <View style={cs.card}>
          <Text style={cs.cardTitle}>HORAS PICO DE DISTRACCIÓN</Text>
          <View style={cs.heatRow}>
            <Text style={[cs.heatTimeLabel]}>{' '}</Text>
            {DAY_LABELS.map(dl => <Text key={dl} style={cs.heatDayLabel}>{dl}</Text>)}
          </View>
          {['10am','9pm'].map((lbl, row) => (
            <View key={lbl} style={cs.heatRow}>
              <Text style={cs.heatTimeLabel}>{lbl}</Text>
              {d.heatmap[row].map((v, col) => {
                const alpha = Math.round(v*255).toString(16).padStart(2,'0');
                return <View key={col} style={[cs.heatBox, { backgroundColor:`#FF5252${alpha}` }]}/>;
              })}
            </View>
          ))}
          <View style={cs.heatLegendRow}>
            <Text style={cs.heatLegendTxt}>Baja</Text>
            {[0.15,0.3,0.5,0.7,0.9].map((v,i) => {
              const alpha = Math.round(v*255).toString(16).padStart(2,'0');
              return <View key={i} style={[cs.heatLegendBox, { backgroundColor:`#FF5252${alpha}` }]}/>;
            })}
            <Text style={cs.heatLegendTxt}>Alta</Text>
          </View>
        </View>

        <View style={cs.summaryCard}>
          <Text style={cs.summaryTitle}>¿Qué significa esto?</Text>
          <Text style={cs.summaryTxt}>
            Tus picos de distracción coinciden con las noches (9pm) de viernes a domingo.
            Reducir el uso en esos momentos puede mejorar tu rendimiento la semana siguiente.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const cs = StyleSheet.create({
  scroll:        { paddingHorizontal:space.screen, paddingBottom:rv(30) },
  insight:       { flexDirection:'row', backgroundColor:'#FFFBEB', borderRadius:radius.md, padding:rv(14), marginBottom:rv(16), borderLeftWidth:3, borderLeftColor:C.social, gap:10 },
  insightTxt:    { flex:1, fontSize:font.sm, color:C.navy, lineHeight:rs(20) },
  card:          { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  cardTitle:     { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1, marginBottom:rv(14) },
  weekRow:       { flexDirection:'row', alignItems:'center', marginBottom:rv(10), gap:8 },
  weekLabel:     { width:50, fontSize:font.sm, fontWeight:'600', color:C.muted },
  weekBarBg:     { flex:1, height:rv(12), borderRadius:99, backgroundColor:'#EEF2FF', overflow:'hidden' },
  weekBarFill:   { height:'100%', borderRadius:99 },
  weekStat:      { width:75, fontSize:font.sm, fontWeight:'700', textAlign:'right' },
  weekGrade:     { fontWeight:'800' },
  heatRow:       { flexDirection:'row', alignItems:'center', marginBottom:rv(4) },
  heatTimeLabel: { width:36, fontSize:font.xs, color:C.muted, fontWeight:'600' },
  heatDayLabel:  { flex:1, fontSize:font.xs, color:C.muted, fontWeight:'600', textAlign:'center' },
  heatBox:       { flex:1, height:rv(28), borderRadius:4, marginHorizontal:2 },
  heatLegendRow: { flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:rv(8) },
  heatLegendBox: { width:16, height:12, borderRadius:3 },
  heatLegendTxt: { fontSize:font.xs, color:C.muted },
  summaryCard:   { backgroundColor:'#EEF2FF', borderRadius:radius.lg, padding:rv(16) },
  summaryTitle:  { fontSize:font.md, fontWeight:'700', color:C.study, marginBottom:rv(6) },
  summaryTxt:    { fontSize:font.sm, color:C.navy, lineHeight:rs(20) },
});

// ══════════════════════════════════════════════════════
//  SUB-SCREEN 4 — REPORTE SEMANAL
// ══════════════════════════════════════════════════════
function ReporteScreen({ onBack }) {
  const d = REPORT;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - d.score / 100);

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <BackHeader title="Reporte semanal" onBack={onBack} rightLabel="↓ PDF" onRight={() => {}}/>
      <ScrollView contentContainerStyle={rp.scroll} showsVerticalScrollIndicator={false}>

        <View style={rp.scoreCard}>
          <View style={rp.scoreCircle}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9"/>
              <Circle cx="50" cy="50" r={r} fill="none" stroke={C.accent} strokeWidth="9"
                strokeDasharray={`${circumference}`} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 50 50)"/>
            </Svg>
            <View style={rp.scoreOverlay}>
              <Text style={rp.scoreValue}>{d.score}</Text>
            </View>
          </View>
          <View style={{ flex:1 }}>
            <Text style={rp.scoreLabel}>PUNTUACIÓN DE HÁBITOS</Text>
            <Text style={rp.scorePeriod}>{d.dateRange}</Text>
            <Text style={rp.scoreDelta}>↑ +{d.scoreDelta} pts vs semana anterior</Text>
          </View>
        </View>

        <View style={rp.grid}>
          {[
            { label:'ESTUDIO EFECTIVO',    val:`${d.studyH}h ${d.studyM}m`,  color:C.navy },
            { label:'OCIO DIGITAL',         val:`${d.leisureH}h ${d.leisureM}m`, color:C.social },
            { label:'TAREAS COMPLETADAS',  val:`${d.tasksOk} / ${d.tasksTotal}`, color:C.success },
            { label:'SESIONES POMODORO',   val:`${d.pomodoros} 🍅`,            color:C.navy },
          ].map((m,i) => (
            <View key={i} style={rp.metricCard}>
              <Text style={rp.metricLabel}>{m.label}</Text>
              <Text style={[rp.metricVal, { color:m.color }]}>{m.val}</Text>
            </View>
          ))}
        </View>

        <View style={rp.recoCard}>
          <Text style={rp.recoTitle}>RECOMENDACIONES</Text>
          {d.recommendations.map((rec, i) => (
            <View key={i} style={rp.recoRow}>
              <Text style={{ fontSize:rs(18) }}>{rec.icon}</Text>
              <Text style={rp.recoTxt}>{rec.text}</Text>
            </View>
          ))}
        </View>

        <View style={rp.compCard}>
          <Text style={rp.compTitle}>Esta semana vs anterior</Text>
          {[
            { label:'Estudio', curr:34, prev:28, color:C.study },
            { label:'Tareas',  curr:78, prev:65, color:C.success },
            { label:'Ocio',    curr:12, prev:18, color:C.other },
          ].map((row, i) => (
            <View key={i} style={rp.compRow}>
              <Text style={rp.compLabel}>{row.label}</Text>
              <View style={rp.compBars}>
                <View style={[rp.compBarPrev, { width:`${(row.prev/40)*100}%` }]}/>
                <View style={[rp.compBarCurr, { width:`${(row.curr/40)*100}%`, backgroundColor:row.color }]}/>
              </View>
              <Text style={[rp.compDelta, { color:row.curr>=row.prev?C.success:C.other }]}>
                {row.curr>=row.prev?'+':''}{row.curr-row.prev}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const rp = StyleSheet.create({
  scroll:      { paddingHorizontal:space.screen, paddingBottom:rv(30) },
  scoreCard:   { backgroundColor:C.navy, borderRadius:radius.lg, padding:rv(20), flexDirection:'row', alignItems:'center', marginBottom:rv(14), gap:16 },
  scoreCircle: { position:'relative', width:100, height:100 },
  scoreOverlay:{ ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center' },
  scoreValue:  { fontSize:rs(30), fontWeight:'900', color:'#fff' },
  scoreLabel:  { fontSize:font.xs, fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:1, marginBottom:rv(4) },
  scorePeriod: { fontSize:font.xl, fontWeight:'800', color:'#fff' },
  scoreDelta:  { fontSize:font.sm, color:C.accent, fontWeight:'600', marginTop:rv(4) },
  grid:        { flexDirection:'row', flexWrap:'wrap', gap:rv(10), marginBottom:rv(14) },
  metricCard:  { flex:1, minWidth:(W-space.screen*2-rv(10))/2-1, backgroundColor:C.card, borderRadius:radius.lg, padding:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  metricLabel: { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:0.8, marginBottom:rv(6) },
  metricVal:   { fontSize:rs(22), fontWeight:'800' },
  recoCard:    { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), marginBottom:rv(14), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  recoTitle:   { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1, marginBottom:rv(12) },
  recoRow:     { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:rv(10) },
  recoTxt:     { flex:1, fontSize:font.md, color:C.navy, lineHeight:rs(22) },
  compCard:    { backgroundColor:C.card, borderRadius:radius.lg, padding:rv(16), shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  compTitle:   { fontSize:font.md, fontWeight:'700', color:C.navy, marginBottom:rv(12) },
  compRow:     { flexDirection:'row', alignItems:'center', marginBottom:rv(10), gap:8 },
  compLabel:   { width:52, fontSize:font.sm, fontWeight:'600', color:C.muted },
  compBars:    { flex:1, height:rv(18) },
  compBarPrev: { position:'absolute', bottom:0, left:0, height:rv(8), borderRadius:99, backgroundColor:'#E8ECF4' },
  compBarCurr: { position:'absolute', bottom:0, left:0, height:rv(18), borderRadius:99 },
  compDelta:   { width:30, fontSize:font.sm, fontWeight:'800', textAlign:'right' },
});

// ══════════════════════════════════════════════════════
//  MAIN StatsScreen
// ══════════════════════════════════════════════════════
export default function StatsScreen() {
  const [tab,       setTab]       = useState(0);
  const [subScreen, setSubScreen] = useState(null);

  if (subScreen === 'correlation') return <CorrelationScreen onBack={() => setSubScreen(null)}/>;
  if (subScreen === 'report')      return <ReporteScreen     onBack={() => setSubScreen(null)}/>;

  return (
    <SafeAreaView style={ms.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <View style={ms.header}>
        <Text style={ms.headerTitle}>Estadísticas</Text>
        <TouchableOpacity style={ms.reportPill} onPress={() => setSubScreen('report')} activeOpacity={0.8}>
          <Text style={ms.reportPillTxt}>📋 Reporte</Text>
        </TouchableOpacity>
      </View>
      <View style={ms.tabBar}>
        {[{ label:'📱 Dispositivo', i:0 },{ label:'🎯 Hábitos', i:1 }].map(({ label, i }) => (
          <TouchableOpacity key={i} style={[ms.mainTab, tab===i && ms.mainTabActive]} onPress={() => setTab(i)} activeOpacity={0.8}>
            <Text style={[ms.mainTabTxt, tab===i && ms.mainTabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex:1 }}>
        {tab === 0
          ? <DeviceUsageView/>
          : <HabitsView onCorrelation={() => setSubScreen('correlation')}/>
        }
      </View>
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  root:            { flex:1, backgroundColor:C.bg },
  header:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:space.screen, paddingTop:rv(12), paddingBottom:rv(8) },
  headerTitle:     { fontSize:font.xxl, fontWeight:'800', color:C.navy },
  reportPill:      { backgroundColor:C.navy, paddingVertical:6, paddingHorizontal:14, borderRadius:radius.full },
  reportPillTxt:   { fontSize:font.sm, fontWeight:'700', color:'#fff' },
  tabBar:          { flexDirection:'row', marginHorizontal:space.screen, marginBottom:rv(14), backgroundColor:'#E8ECF4', borderRadius:radius.md, padding:4 },
  mainTab:         { flex:1, paddingVertical:rv(9), alignItems:'center', borderRadius:radius.sm-2 },
  mainTabActive:   { backgroundColor:C.navy, shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:3 },
  mainTabTxt:      { fontSize:font.md, fontWeight:'600', color:C.muted },
  mainTabTxtActive:{ color:'#fff' },
});