/**
 * KanbanScreen.js
 * Vista Kanban para las tareas: PENDIENTE → EN CURSO → LISTO
 * - Muestra las mismas tareas que TasksScreen en formato columnas
 * - Permite mover tarjetas entre columnas con un toque
 * - Botón "+ Tarea" llama al callback del padre para abrir el modal de nueva tarea
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { font, space, radius, rv, rs } from '../../theme/responsive';

const C = {
  bg:     colors.background,
  card:   '#FFFFFF',
  navy:   colors.primary,
  accent: colors.accent,
  muted:  colors.textSecondary,
  border: colors.border,
  success: colors.success,
  danger:  colors.error,
  blue:    '#3B82F6',
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

const COLUMNS = [
  { key:'pending',    label:'PEND.',   dot:'#F59E0B', bg:'#FFFBEB' },
  { key:'in_progress',label:'CURSO',   dot:C.blue,    bg:'#EFF6FF' },
  { key:'done',       label:'LISTO',   dot:C.success,  bg:'#F0FDF4' },
];

// ── Priority bar color ────────────────────────────────────────────
const PRIO_COLOR = { alta:'#EF4444', media:'#F59E0B', baja:'#22C55E' };
const PRIO_LABEL = { alta:'Alta', media:'Media', baja:'Baja' };

export default function KanbanScreen({ tasks = [], onBack, onAddTask, onMoveTask }) {
  // Group tasks by status
  const [localTasks, setLocalTasks] = useState(() => {
    if (tasks.length > 0) return tasks;
    // Demo data when no real tasks passed
    return [
      { id:'k1', titulo:'Examen Mat.',     fecha:'25 Feb', prioridad:'alta',  status:'pending',     progress:0   },
      { id:'k2', titulo:'Inglés parcial',  fecha:'3 Mar',  prioridad:'media', status:'pending',     progress:0   },
      { id:'k3', titulo:'Trabajo Git',     fecha:'28 Feb', prioridad:'media', status:'in_progress', progress:0.55 },
      { id:'k4', titulo:'Proyecto BD',     fecha:'1 Mar',  prioridad:'baja',  status:'in_progress', progress:0.3  },
      { id:'k5', titulo:'Base de datos',   fecha:'18 Feb', prioridad:'baja',  status:'done',        progress:1   },
      { id:'k6', titulo:'Tarea POO',       fecha:'15 Feb', prioridad:'baja',  status:'done',        progress:1   },
      { id:'k7', titulo:'Reporte Lab',     fecha:'12 Feb', prioridad:'baja',  status:'done',        progress:1   },
    ];
  });

  const moveTask = (taskId, fromCol, toColKey) => {
    setLocalTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: toColKey, progress: toColKey === 'done' ? 1 : t.progress } : t
    ));
    onMoveTask?.(taskId, toColKey);
  };

  const showMoveOptions = (task) => {
    const from = task.status;
    const options = COLUMNS
      .filter(c => c.key !== from)
      .map(c => ({
        text: `Mover a ${c.label}`,
        onPress: () => moveTask(task.id, from, c.key),
      }));
    Alert.alert(task.titulo, 'Mover tarea a:', [
      ...options,
      { text:'Cancelar', style:'cancel' },
    ]);
  };

  const getColumnTasks = (colKey) => localTasks.filter(t => t.status === colKey);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={hdr.wrap}>
        <BackIcon onPress={onBack}/>
        <Text style={hdr.title}>Mi Kanban</Text>
        <TouchableOpacity style={hdr.addBtn} onPress={onAddTask} activeOpacity={0.8}>
          <Text style={hdr.addTxt}>+ Tarea</Text>
        </TouchableOpacity>
      </View>

      {/* Kanban columns — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(20), gap:12 }}>

        {COLUMNS.map(col => {
          const colTasks = getColumnTasks(col.key);
          return (
            <View key={col.key} style={[col_s.column, { backgroundColor: col.bg }]}>
              {/* Column header */}
              <View style={col_s.colHeader}>
                <View style={[col_s.dot, { backgroundColor: col.dot }]}/>
                <Text style={col_s.colTitle}>{col.label}</Text>
                <View style={[col_s.badge, { backgroundColor: col.dot }]}>
                  <Text style={col_s.badgeTxt}>{colTasks.length}</Text>
                </View>
              </View>

              {/* Cards */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex:1 }}
                contentContainerStyle={{ gap:8, paddingBottom:8 }}>
                {colTasks.length === 0 && (
                  <View style={col_s.empty}>
                    <Text style={col_s.emptyTxt}>Sin tareas</Text>
                  </View>
                )}
                {colTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[kcard.wrap, col.key === 'done' && kcard.done]}
                    onPress={() => showMoveOptions(task)}
                    activeOpacity={0.8}>
                    <Text style={[kcard.title, col.key === 'done' && kcard.titleDone]}>
                      {col.key === 'done' ? '✓ ' : ''}{task.titulo}
                    </Text>
                    <Text style={kcard.date}>{task.fecha}</Text>

                    {/* Priority pill — only for non-done */}
                    {col.key !== 'done' && task.prioridad === 'alta' && (
                      <View style={[kcard.pill, { backgroundColor:'#FEE2E2' }]}>
                        <View style={[kcard.pillDot, { backgroundColor:'#EF4444' }]}/>
                        <Text style={[kcard.pillTxt, { color:'#EF4444' }]}>Alta</Text>
                      </View>
                    )}

                    {/* Progress bar — only for in_progress */}
                    {col.key === 'in_progress' && task.progress > 0 && (
                      <View style={kcard.progressWrap}>
                        <View style={kcard.progressBg}>
                          <View style={[kcard.progressFill, {
                            width: `${Math.round(task.progress * 100)}%`,
                            backgroundColor: PRIO_COLOR[task.prioridad] || C.blue,
                          }]}/>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <Text style={foot.hint}>Toca una tarjeta para moverla entre columnas</Text>
    </SafeAreaView>
  );
}

const hdr = StyleSheet.create({
  wrap:   { flexDirection:'row', alignItems:'center', paddingHorizontal:space.screen,
            paddingTop:rv(10), paddingBottom:rv(12) },
  title:  { fontSize:font.lg, fontWeight:'800', color:C.navy, flex:1, marginLeft:8 },
  addBtn: { backgroundColor:C.navy, paddingHorizontal:14, paddingVertical:8,
            borderRadius:radius.md },
  addTxt: { color:'#fff', fontWeight:'700', fontSize:font.sm },
});

const col_s = StyleSheet.create({
  column:    { width: 185, borderRadius:radius.lg, padding:rv(12),
               maxHeight: '92%', minHeight: rv(300) },
  colHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:rv(12) },
  dot:       { width:8, height:8, borderRadius:4 },
  colTitle:  { fontSize:font.xs, fontWeight:'800', color:C.muted, letterSpacing:1, flex:1 },
  badge:     { width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center' },
  badgeTxt:  { color:'#fff', fontSize:rs(10), fontWeight:'800' },
  empty:     { paddingVertical:rv(20), alignItems:'center' },
  emptyTxt:  { fontSize:font.xs, color:C.muted },
});

const kcard = StyleSheet.create({
  wrap:      { backgroundColor:C.card, borderRadius:radius.md, padding:rv(12),
               shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4,
               shadowOffset:{width:0,height:1}, elevation:2 },
  done:      { backgroundColor:'#F9FAFB', opacity:0.8 },
  title:     { fontSize:font.sm, fontWeight:'700', color:C.navy, marginBottom:4 },
  titleDone: { textDecorationLine:'line-through', color:C.muted, fontWeight:'600' },
  date:      { fontSize:font.xs, color:C.muted },
  pill:      { flexDirection:'row', alignItems:'center', gap:4, marginTop:8,
               alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:4,
               borderRadius:radius.full },
  pillDot:   { width:6, height:6, borderRadius:3 },
  pillTxt:   { fontSize:rs(10), fontWeight:'700' },
  progressWrap: { marginTop:8 },
  progressBg:   { height:4, backgroundColor:'#E5E7EB', borderRadius:2, overflow:'hidden' },
  progressFill: { height:4, borderRadius:2 },
});

const foot = StyleSheet.create({
  hint: { textAlign:'center', fontSize:font.xs, color:C.muted, paddingBottom:rv(12) },
});