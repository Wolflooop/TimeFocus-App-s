import React, { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View, Text, StyleSheet, ScrollView, Modal, Pressable,
  TouchableOpacity, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { W, H, font, space, radius, rv, rs, clamp, icon } from '../../theme/responsive';
import api from '../../services/api';
import KanbanScreen from './KanbanScreen';

// ── Icons ──────────────────────────────────────────────────────────
const GridIcon  = () => (<Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none"><Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={colors.primary} strokeWidth="1.8"/><Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={colors.primary} strokeWidth="1.8"/><Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={colors.primary} strokeWidth="1.8"/><Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={colors.primary} strokeWidth="1.8"/></Svg>);
const PlusIcon  = () => (<Svg width={icon.md} height={icon.md} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><Line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></Svg>);
const BackIcon  = () => (<Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M5 12l7-7M5 12l7 7" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>);
const EditIcon  = () => (<Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/></Svg>);
const TrashIcon = () => (<Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#FF5252" strokeWidth="2" strokeLinecap="round"/></Svg>);
const CheckIcon = ({ done, size }) => (<Svg width={size||icon.sm} height={size||icon.sm} viewBox="0 0 24 24" fill="none">{done && <Path d="M4 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}</Svg>);

const PRIO_CONFIG = {
  alta:  { label: '• Urgente', bg: '#FFEBEE', text: '#FF5252' },
  media: { label: '• En curso', bg: '#E3F2FD', text: '#2196F3' },
  baja:  { label: '• Normal',   bg: '#E8F5E9', text: '#4CAF50' },
};
const FILTERS = ['Todas', 'Hoy', 'Semana', 'Pendientes'];

export default function TasksScreen({ onNavigate, onSubScreen, navHeight = 0, onTasksChanged }) {
  const [filter,     setFilter]     = useState('Todas');
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showNew,    setShowNew]    = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [actionTask, setActionTask] = useState(null);
  const [showAction, setShowAction] = useState(false);
  const [editTask,   setEditTask]   = useState(null);
  const [showEdit,   setShowEdit]   = useState(false);

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { onSubScreen?.(showNew || (showEdit && !!editTask)); }, [showNew, showEdit, editTask]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const toggleTask = async (task) => {
    const next = task.estado === 'completada' ? 'pendiente' : 'completada';
    const payload = {
      estado:       next,
      titulo:       task.titulo,
      descripcion:  task.descripcion,
      fecha_limite: task.fecha_limite ? String(task.fecha_limite).slice(0, 10) : null,
      prioridad:    task.prioridad,
      materia:      task.materia,
    };
    try {
      await api.put(`/tasks/${task.id_tarea}`, payload);
      setTasks(ts => ts.map(t => t.id_tarea === task.id_tarea ? { ...t, estado: next } : t));
      onTasksChanged?.();
    } catch (e) { console.log(e); }
  };

  const deleteTask = async (task) => {
    try {
      await api.delete(`/tasks/${task.id_tarea}`);
      setTasks(ts => ts.filter(t => t.id_tarea !== task.id_tarea));
      onTasksChanged?.();
    } catch (e) { console.log(e); }
    setShowAction(false);
  };

  const openAction = (task) => { setActionTask(task); setShowAction(true); };
  const openEdit   = () => {
    setShowAction(false);
    setTimeout(() => { setEditTask({ ...actionTask }); setShowEdit(true); }, 250);
  };

  const allFiltered = tasks.filter(t => {
    const today     = new Date().toISOString().slice(0, 10);
    const fechaNorm = t.fecha_limite ? String(t.fecha_limite).slice(0, 10) : '';
    if (filter === 'Hoy')        return fechaNorm === today;
    if (filter === 'Semana')     { const diff = (new Date(fechaNorm) - new Date()) / 86400000; return diff >= 0 && diff <= 7; }
    if (filter === 'Pendientes') return t.estado === 'pendiente';
    return true;
  });

  const completadasCount = allFiltered.filter(t => t.estado === 'completada').length;
  const pending          = allFiltered.filter(t => t.estado !== 'completada');
  const urgente          = pending.filter(t => t.prioridad === 'alta');
  const enCurso          = pending.filter(t => t.prioridad === 'media');
  const normal           = pending.filter(t => !['alta','media'].includes(t.prioridad));

  if (showNew)               return <TaskForm mode="new"  onBack={() => { setShowNew(false);  loadTasks(); onTasksChanged?.(); }}/>;
  if (showEdit && editTask)  return <TaskForm mode="edit" task={editTask} onBack={() => { setShowEdit(false); loadTasks(); onTasksChanged?.(); }}/>;
  if (showKanban) return (
    <KanbanScreen
      tasks={tasks.map(t => ({ id: String(t.id_tarea), titulo: t.titulo, fecha: t.fecha_limite ? String(t.fecha_limite).slice(0,10) : '', prioridad: t.prioridad, status: t.estado === 'completada' ? 'done' : t.estado === 'en_progreso' ? 'in_progress' : 'pending', progress: 0 }))}
      onBack={() => setShowKanban(false)}
      onAddTask={() => { setShowKanban(false); setShowNew(true); }}
      onMoveTask={(taskId, newStatus) => {
        setTasks(prev => prev.map(t => String(t.id_tarea) === taskId ? { ...t, estado: newStatus === 'done' ? 'completada' : newStatus === 'in_progress' ? 'en_progreso' : 'pendiente' } : t));
        onTasksChanged?.();
      }}
    />
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Tareas</Text>
        <TouchableOpacity style={s.gridBtn} activeOpacity={0.7} onPress={() => setShowKanban(true)}><GridIcon/></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersWrap} contentContainerStyle={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {completadasCount > 0 && (
        <View style={s.doneBar}>
          <View style={s.doneBarDot}/>
          <Text style={s.doneBarText}>{completadasCount} tarea{completadasCount>1?'s':''} completada{completadasCount>1?'s':''} hoy ✓</Text>
        </View>
      )}

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.primary}/></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {urgente.length  > 0 && <TaskSection label="URGENTE"   color="#FF5252" tasks={urgente}  onToggle={toggleTask} onLongPress={openAction}/>}
          {enCurso.length  > 0 && <TaskSection label="EN CURSO"  color="#2196F3" tasks={enCurso}  onToggle={toggleTask} onLongPress={openAction}/>}
          {normal.length   > 0 && <TaskSection label="PENDIENTE" color="#FF9800" tasks={normal}   onToggle={toggleTask} onLongPress={openAction}/>}
          {pending.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>✅</Text>
              <Text style={s.emptyTitle}>{completadasCount > 0 ? '¡Todo listo!' : 'No hay tareas aquí'}</Text>
              <Text style={s.emptyText}>{completadasCount > 0 ? `Completaste ${completadasCount} tarea${completadasCount>1?'s':''}` : 'Agrega una nueva tarea con el botón +'}</Text>
            </View>
          )}
          <View style={{ height: rv(80,60,100) }}/>
        </ScrollView>
      )}

      <TouchableOpacity style={[s.fab, { bottom: rv(28,20,36) + navHeight }]} onPress={() => setShowNew(true)} activeOpacity={0.85}>
        <PlusIcon/>
      </TouchableOpacity>

      <Modal visible={showAction} transparent animationType="slide" onRequestClose={() => setShowAction(false)}>
        <Pressable style={m.overlay} onPress={() => setShowAction(false)}>
          <View style={m.sheet}>
            <View style={m.handle}/>
            {actionTask && (
              <>
                <Text style={m.sheetTitle} numberOfLines={2}>{actionTask.titulo}</Text>
                <Text style={m.sheetSub}>{actionTask.materia || 'Sin materia'} · {PRIO_CONFIG[actionTask.prioridad]?.label.replace('• ','') || 'Normal'}</Text>
                <TouchableOpacity style={m.row} onPress={openEdit} activeOpacity={0.7}>
                  <View style={m.rowIcon}><EditIcon/></View>
                  <View style={m.rowInfo}><Text style={m.rowTitle}>Editar tarea</Text><Text style={m.rowDesc}>Modifica título, fecha, prioridad u otros campos</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={m.row} onPress={() => { toggleTask(actionTask); setShowAction(false); }} activeOpacity={0.7}>
                  <View style={[m.rowIcon, { backgroundColor: '#E8F5E9' }]}><CheckIcon done size={icon.sm}/></View>
                  <View style={m.rowInfo}><Text style={m.rowTitle}>{actionTask.estado === 'completada' ? 'Marcar como pendiente' : 'Marcar como completada'}</Text><Text style={m.rowDesc}>{actionTask.estado === 'completada' ? 'Mover de regreso a pendientes' : 'Registrarla como completada'}</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={m.row} onPress={() => deleteTask(actionTask)} activeOpacity={0.7}>
                  <View style={[m.rowIcon, { backgroundColor: '#FFEBEE' }]}><TrashIcon/></View>
                  <View style={m.rowInfo}><Text style={[m.rowTitle, { color: '#FF5252' }]}>Eliminar tarea</Text><Text style={m.rowDesc}>Se borra permanentemente</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={m.cancelBtn} onPress={() => setShowAction(false)}>
                  <Text style={m.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function TaskSection({ label, color, tasks, onToggle, onLongPress }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionBar, { backgroundColor: color }]}/>
        <Text style={[s.sectionLabel, { color }]}>{label}</Text>
        <Text style={[s.sectionCount, { color }]}>{tasks.length}</Text>
      </View>
      {tasks.map(task => <TaskItem key={task.id_tarea} task={task} onToggle={onToggle} onLongPress={onLongPress}/>)}
    </View>
  );
}

function TaskItem({ task, onToggle, onLongPress }) {
  const prio = PRIO_CONFIG[task.prioridad] || PRIO_CONFIG.baja;
  const progreso = task.prioridad === 'alta' ? 0.85 : task.prioridad === 'media' ? 0.45 : 0.15;
  return (
    <TouchableOpacity style={s.taskCard} onPress={() => onToggle(task)} onLongPress={() => onLongPress(task)} delayLongPress={400} activeOpacity={0.8}>
      <View style={s.cb}/>
      <View style={s.taskBody}>
        <Text style={s.taskTitle} numberOfLines={2}>{task.titulo}</Text>
        <Text style={s.taskMeta}>{task.materia || 'Sin materia'} · {task.fecha_limite ? `Vence ${String(task.fecha_limite).slice(0,10)}` : 'Sin fecha'}</Text>
        <View style={s.progressBg}><View style={[s.progressFg, { width: `${progreso*100}%`, backgroundColor: prio.text }]}/></View>
      </View>
      <View style={[s.badge, { backgroundColor: prio.bg }]}><Text style={[s.badgeText, { color: prio.text }]}>{prio.label}</Text></View>
    </TouchableOpacity>
  );
}

// ── Formulario unificado Nueva/Editar tarea ────────────────────────
function TaskForm({ mode, task, onBack }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    titulo:       task?.titulo       || '',
    materia:      task?.materia      || '',
    fecha_limite: task?.fecha_limite ? String(task.fecha_limite).slice(0,10) : '',
    prioridad:    task?.prioridad    || 'media',
    estado:       task?.estado       || 'pendiente',
    descripcion:  task?.descripcion  || '',
  });
  const [showPicker, setShowPicker] = useState(false);
  const [date,       setDate]       = useState(task?.fecha_limite ? new Date(task.fecha_limite) : new Date());
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const PRIORIDADES = ['Alta','Media','Baja'];
  const prioColor   = { Alta:'#FF5252', Media:'#F5BF23', Baja:'#4CAF50' };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion || null,
        fecha_limite: form.fecha_limite || null,
        prioridad:    form.prioridad,
        estado:       form.estado,
        materia:      form.materia || null,
      };
      if (isEdit) await api.put(`/tasks/${task.id_tarea}`, payload);
      else        await api.post('/tasks', payload);
      onBack();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar la tarea');
    } finally { setLoading(false); }
  };

  return (
    <View style={ns.root}>
      <View style={ns.header}>
        <TouchableOpacity onPress={onBack} style={ns.backBtn}><BackIcon/></TouchableOpacity>
        <Text style={ns.title}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</Text>
        <View style={{ width: clamp(W*0.09,36,48) }}/>
      </View>

      <ScrollView contentContainerStyle={ns.scroll} keyboardShouldPersistTaps="handled">

        <Text style={ns.label}>TÍTULO *</Text>
        <TextInput
          style={ns.inputBox}
          placeholder="Ej: Entregar reporte de BD"
          placeholderTextColor="#aaa"
          value={form.titulo}
          onChangeText={t => { setForm(f => ({ ...f, titulo: t })); setError(''); }}
        />

        <Text style={ns.label}>MATERIA</Text>
        <TextInput
          style={ns.inputBox}
          placeholder="Ej: Base de datos"
          placeholderTextColor="#aaa"
          value={form.materia}
          onChangeText={t => setForm(f => ({ ...f, materia: t }))}
        />

        <Text style={ns.label}>FECHA DE ENTREGA</Text>
        <TouchableOpacity style={ns.inputBox} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
          <Text style={{ fontSize: font.md, color: form.fecha_limite ? colors.primary : '#aaa' }}>
            {form.fecha_limite || 'Seleccionar fecha  📅'}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date} mode="date" display="default"
            minimumDate={isEdit ? undefined : new Date()}
            onChange={(event, selected) => {
              setShowPicker(false);
              if (selected) {
                setDate(selected);
                const yyyy = selected.getFullYear();
                const mm   = String(selected.getMonth()+1).padStart(2,'0');
                const dd   = String(selected.getDate()).padStart(2,'0');
                setForm(f => ({ ...f, fecha_limite: `${yyyy}-${mm}-${dd}` }));
              }
            }}
          />
        )}

        <Text style={ns.label}>PRIORIDAD</Text>
        <View style={ns.row}>
          {PRIORIDADES.map(p => (
            <TouchableOpacity
              key={p}
              style={[ns.pill, form.prioridad === p.toLowerCase() && { borderColor: prioColor[p], backgroundColor: `${prioColor[p]}18` }]}
              onPress={() => setForm(f => ({ ...f, prioridad: p.toLowerCase() }))}>
              <Text style={[ns.pillText, form.prioridad === p.toLowerCase() && { color: prioColor[p], fontWeight: '700' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ns.label}>NOTAS</Text>
        <TextInput
          style={[ns.inputBox, { height: rv(80,60,100), textAlignVertical: 'top' }]}
          placeholder="Notas adicionales..."
          placeholderTextColor="#aaa"
          multiline
          value={form.descripcion}
          onChangeText={t => setForm(f => ({ ...f, descripcion: t }))}
        />

        {!!error && <Text style={ns.error}>{error}</Text>}

        <TouchableOpacity style={[ns.btnCreate, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={colors.primary}/> : <Text style={ns.btnCreateText}>{isEdit ? 'Guardar cambios ✓' : 'Crear tarea →'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex:1, backgroundColor:'#F5F5F8' },
  header:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:space.screen, paddingTop:rv(16,12,20), paddingBottom:rv(8,6,12) },
  title:          { fontSize:clamp(font.xl,18,26), fontWeight:'800', color:colors.primary },
  gridBtn:        { width:clamp(W*0.09,36,48), height:clamp(W*0.09,36,48), backgroundColor:'#fff', borderRadius:radius.sm, alignItems:'center', justifyContent:'center', borderWidth:0.5, borderColor:'#E8ECF4' },
  filtersWrap:    { maxHeight:rv(46,38,54) },
  filters:        { paddingHorizontal:space.screen, gap:space.sm, paddingBottom:space.sm },
  chip:           { paddingHorizontal:rs(14,10,18), paddingVertical:rv(6,4,8), borderRadius:radius.full, backgroundColor:'#fff', borderWidth:1, borderColor:'#E8ECF4' },
  chipActive:     { backgroundColor:colors.primary, borderColor:colors.primary },
  chipText:       { fontSize:font.sm, fontWeight:'600', color:colors.textSecondary },
  chipTextActive: { color:'#fff' },
  doneBar:        { flexDirection:'row', alignItems:'center', gap:space.sm, marginHorizontal:space.screen, marginBottom:rv(8,5,12), backgroundColor:'#E8F5E9', borderRadius:radius.sm, paddingHorizontal:rs(12,9,16), paddingVertical:rv(8,6,10) },
  doneBarDot:     { width:8, height:8, borderRadius:4, backgroundColor:'#4CAF50' },
  doneBarText:    { fontSize:font.sm, color:'#2E7D32', fontWeight:'600' },
  loading:        { flex:1, alignItems:'center', justifyContent:'center' },
  scroll:         { paddingHorizontal:space.screen, paddingTop:space.sm },
  section:        { marginBottom:rv(16,10,20) },
  sectionHeader:  { flexDirection:'row', alignItems:'center', gap:space.sm, marginBottom:rv(10,7,14) },
  sectionBar:     { width:3, height:rs(14,10,18), borderRadius:2 },
  sectionLabel:   { fontSize:font.xs, fontWeight:'800', letterSpacing:1, flex:1 },
  sectionCount:   { fontSize:font.xs, fontWeight:'700', opacity:0.7 },
  taskCard:       { backgroundColor:'#fff', borderRadius:radius.md, padding:rs(14,10,18), marginBottom:rv(8,6,10), flexDirection:'row', alignItems:'center', gap:rs(12,8,16), borderWidth:0.5, borderColor:'#E8ECF4' },
  cb:             { width:clamp(W*0.055,20,28), height:clamp(W*0.055,20,28), borderRadius:radius.sm, borderWidth:1.5, borderColor:'#D0D8E8', alignItems:'center', justifyContent:'center', flexShrink:0 },
  taskBody:       { flex:1 },
  taskTitle:      { fontSize:font.sm, fontWeight:'600', color:colors.primary, marginBottom:3 },
  taskMeta:       { fontSize:font.xs, color:'#8A9CC2', marginBottom:rv(8,5,10) },
  progressBg:     { height:3, backgroundColor:'#F0F0F5', borderRadius:2 },
  progressFg:     { height:3, borderRadius:2 },
  badge:          { paddingHorizontal:rs(8,6,10), paddingVertical:3, borderRadius:radius.full, alignSelf:'center', flexShrink:0 },
  badgeText:      { fontSize:font.xs, fontWeight:'700' },
  empty:          { alignItems:'center', paddingVertical:rv(48,32,64) },
  emptyIcon:      { fontSize:clamp(W*0.12,40,56), marginBottom:rv(12,8,18) },
  emptyTitle:     { fontSize:font.lg, fontWeight:'800', color:colors.primary, marginBottom:rv(6,4,8) },
  emptyText:      { fontSize:font.sm, color:'#8A9CC2', textAlign:'center' },
  fab:            { position:'absolute', right:rs(20,14,28), width:clamp(W*0.13,48,60), height:clamp(W*0.13,48,60), borderRadius:radius.lg, backgroundColor:colors.accent, alignItems:'center', justifyContent:'center', elevation:6, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8 },
});
const m = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'flex-end' },
  sheet:      { backgroundColor:'#fff', borderTopLeftRadius:radius.xl, borderTopRightRadius:radius.xl, paddingHorizontal:space.screen, paddingBottom:rv(32,20,44), paddingTop:rv(12,8,18) },
  handle:     { width:36, height:4, borderRadius:2, backgroundColor:'#E0E0E0', alignSelf:'center', marginBottom:rv(16,10,22) },
  sheetTitle: { fontSize:font.lg, fontWeight:'800', color:colors.primary, marginBottom:4 },
  sheetSub:   { fontSize:font.sm, color:'#8A9CC2', marginBottom:rv(20,14,28) },
  row:        { flexDirection:'row', alignItems:'center', gap:rs(14,10,18), paddingVertical:rv(14,10,18), borderBottomWidth:0.5, borderBottomColor:'#F0F0F5' },
  rowIcon:    { width:clamp(W*0.11,40,52), height:clamp(W*0.11,40,52), borderRadius:radius.md, backgroundColor:'#F5F5F8', alignItems:'center', justifyContent:'center', flexShrink:0 },
  rowInfo:    { flex:1 },
  rowTitle:   { fontSize:font.md, fontWeight:'700', color:colors.primary },
  rowDesc:    { fontSize:font.xs, color:'#8A9CC2', marginTop:2 },
  cancelBtn:  { marginTop:rv(16,10,22), alignItems:'center', paddingVertical:rv(12,8,16) },
  cancelText: { fontSize:font.md, color:'#8A9CC2', fontWeight:'600' },
});
// FIX: se agregó `color: colors.primary` en inputBox → texto visible en todos los Android
const ns = StyleSheet.create({
  root:         { flex:1, backgroundColor:'#fff' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:space.screen, paddingTop:rv(16,12,20), paddingBottom:rv(12,8,16), borderBottomWidth:0.5, borderBottomColor:'#E8ECF4' },
  backBtn:      { width:clamp(W*0.09,36,48), height:clamp(W*0.09,36,48), borderRadius:radius.sm, backgroundColor:'#F5F5F8', alignItems:'center', justifyContent:'center' },
  title:        { fontSize:font.lg, fontWeight:'800', color:colors.primary },
  scroll:       { padding:space.screen },
  label:        { fontSize:font.xs, fontWeight:'700', color:'#888', letterSpacing:1, marginBottom:rv(6,4,8), marginTop:rv(14,10,18) },
  inputBox:     { borderWidth:1, borderColor:'#E0E0E0', borderRadius:radius.sm, padding:rs(13,10,16),
                  backgroundColor:'#FAFAFA', minHeight:clamp(H*0.055,44,56),
                  justifyContent:'center',
                  color: colors.primary,           // ← FIX: texto visible en todos los Android
                  fontSize: font.md },
  row:          { flexDirection:'row', gap:space.sm },
  pill:         { flex:1, paddingVertical:rv(10,7,13), borderRadius:radius.sm, borderWidth:1.5, borderColor:'#E0E0E0', alignItems:'center', backgroundColor:'#FAFAFA' },
  pillText:     { fontSize:font.sm, color:'#888', fontWeight:'500' },
  btnCreate:    { backgroundColor:colors.accent, paddingVertical:rv(16,12,20), borderRadius:radius.md, alignItems:'center', marginTop:rv(24,16,32), marginBottom:rv(16,10,20) },
  btnCreateText:{ color:colors.primary, fontWeight:'800', fontSize:font.md },
  error:        { fontSize:font.xs, color:'#FF5252', textAlign:'center', marginTop:space.sm },
});
