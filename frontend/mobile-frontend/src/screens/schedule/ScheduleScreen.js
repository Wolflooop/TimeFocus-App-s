/**
 * ScheduleScreen.js
 * ─────────────────
 * Vista semanal de horario escolar.
 * • FAB (+) → formulario la primera vez; icono lápiz una vez que hay clases.
 * • Long-press sobre un evento → editar / eliminar.
 * • Estado automático: "Por iniciar" | "En curso" | "Terminada" según hora actual.
 * • Guardado local con AsyncStorage (clave: 'schedule_entries').
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { W, H, font, space, radius, rv, rs, clamp, icon } from '../../theme/responsive';

// ─── Constantes ────────────────────────────────────────────────────
const STORAGE_KEY = 'schedule_entries';
const DAYS_LABELS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const START_HOUR   = 7;
const END_HOUR     = 21;
const HOUR_H       = rv(60, 46, 72);

const PALETTE = [
  { bg: '#E8F0FE', text: '#1A56DB', border: '#93B4F9' },
  { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784' },
  { bg: '#F3E5F5', text: '#7B1FA2', border: '#CE93D8' },
  { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  { bg: '#FCE4EC', text: '#C2185B', border: '#F48FB1' },
  { bg: '#E0F2F1', text: '#00695C', border: '#80CBC4' },
  { bg: '#FFF8E1', text: '#7A5F00', border: '#FFE082' },
  { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
];

// ─── Icons ─────────────────────────────────────────────────────────
const PlusIcon = () => (
  <Svg width={icon.md} height={icon.md} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="5"  y1="12" x2="19" y2="12" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
);
const EditFabIcon = () => (
  <Svg width={icon.md} height={icon.md} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);
const BackIcon = () => (
  <Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12l7-7M5 12l7 7"
      stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const TrashIcon = () => (
  <Svg width={icon.sm} height={icon.sm} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#FF5252" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);
const ClockIcon = ({ c = colors.primary }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/>
    <Line x1="12" y1="7" x2="12" y2="12" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <Line x1="12" y1="12" x2="16" y2="14" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

// ─── Helpers ───────────────────────────────────────────────────────
const timeToMins = (t = '00:00') => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const getWeekDates = () => {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d.getDate();
  });
};
const getMonthYear = () => {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date(); return `${months[d.getMonth()]} ${d.getFullYear()}`;
};
const autoStatus = (ini, fin) => {
  const now = nowMins(), s = timeToMins(ini), e = timeToMins(fin);
  if (now < s) return 'pending';
  if (now <= e) return 'active';
  return 'done';
};
const pickColor = (used = []) => {
  for (let i = 0; i < PALETTE.length; i++) if (!used.includes(i)) return i;
  return 0;
};

// ══════════════════════════════════════════════════════════════════
// ScheduleScreen
// ══════════════════════════════════════════════════════════════════
export default function ScheduleScreen({ navHeight = 0, onSubScreen }) {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selDay,      setSelDay]      = useState(todayIdx());
  const [showForm,    setShowForm]    = useState(false);
  const [editEntry,   setEditEntry]   = useState(null);
  const [actionEntry, setActionEntry] = useState(null);
  const [showAction,  setShowAction]  = useState(false);

  const hasEntries = entries.length > 0;
  const weekDates  = getWeekDates();
  const today      = todayIdx();

  useEffect(() => { onSubScreen?.(showForm); }, [showForm]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setEntries(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveEntries = async (next) => {
    setEntries(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const dayEntries = entries
    .filter(e => e.dias.includes(selDay))
    .sort((a, b) => timeToMins(a.horaInicio) - timeToMins(b.horaInicio));

  if (showForm) {
    return (
      <EntryForm
        entry={editEntry}
        paletteUsed={entries.map(e => e.colorIdx)}
        onBack={() => { setShowForm(false); setEditEntry(null); }}
        onSave={async (data) => {
          const next = data.id
            ? entries.map(e => e.id === data.id ? data : e)
            : [...entries, { ...data, id: Date.now().toString() }];
          await saveEntries(next);
          setShowForm(false); setEditEntry(null);
        }}
      />
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Horario</Text>
        <View style={s.monthBadge}>
          <Text style={s.monthText}>{getMonthYear()} ▾</Text>
        </View>
      </View>

      {/* Días */}
      <View style={s.weekRow}>
        {DAYS_LABELS.map((lbl, i) => {
          const isToday  = i === today;
          const isActive = i === selDay;
          return (
            <TouchableOpacity key={i} style={s.dayCol} onPress={() => setSelDay(i)} activeOpacity={0.7}>
              <Text style={[s.dayLbl, isActive && s.dayLblActive]}>{lbl}</Text>
              <View style={[s.dayNumWrap, isActive && s.dayNumActive, isToday && !isActive && s.dayNumToday]}>
                <Text style={[s.dayNumText, isActive && s.dayNumTextActive, isToday && !isActive && s.dayNumTextToday]}>
                  {weekDates[i]}
                </Text>
              </View>
              {isToday && <View style={s.todayDot}/>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Separador */}
      <View style={s.divider}/>

      {/* Contenido */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary}/></View>
      ) : dayEntries.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>Sin clases este día</Text>
          <Text style={s.emptySub}>
            {hasEntries ? 'No tienes clases este día' : 'Agrega tu horario con el botón +'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={s.gridScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: navHeight + rv(28, 20, 40), paddingTop: 8 }}>
          <TimeGrid entries={dayEntries} onLongPress={(e) => { setActionEntry(e); setShowAction(true); }}/>
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { bottom: rv(28, 20, 36) + navHeight }]}
        onPress={() => { setEditEntry(null); setShowForm(true); }}
        activeOpacity={0.85}>
        {hasEntries ? <EditFabIcon/> : <PlusIcon/>}
      </TouchableOpacity>

      {/* Modal acción */}
      <Modal visible={showAction} transparent animationType="slide" onRequestClose={() => setShowAction(false)}>
        <Pressable style={m.overlay} onPress={() => setShowAction(false)}>
          <View style={m.sheet}>
            <View style={m.handle}/>
            {actionEntry && (
              <>
                <View style={[m.colorBar, { backgroundColor: PALETTE[actionEntry.colorIdx]?.border }]}/>
                <Text style={m.sheetTitle} numberOfLines={1}>{actionEntry.nombre}</Text>
                <Text style={m.sheetSub}>
                  {actionEntry.aula ? `${actionEntry.aula}  ·  ` : ''}{actionEntry.horaInicio} – {actionEntry.horaFin}
                </Text>
                <TouchableOpacity style={m.row} activeOpacity={0.7} onPress={() => {
                  setShowAction(false);
                  setEditEntry(actionEntry);
                  setTimeout(() => setShowForm(true), 250);
                }}>
                  <View style={m.rowIcon}><EditFabIcon/></View>
                  <View style={m.rowInfo}>
                    <Text style={m.rowTitle}>Editar clase</Text>
                    <Text style={m.rowDesc}>Modifica nombre, aula, horario o días</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={m.row} activeOpacity={0.7} onPress={async () => {
                  await saveEntries(entries.filter(e => e.id !== actionEntry.id));
                  setShowAction(false);
                }}>
                  <View style={[m.rowIcon, { backgroundColor: '#FFEBEE' }]}><TrashIcon/></View>
                  <View style={m.rowInfo}>
                    <Text style={[m.rowTitle, { color: '#FF5252' }]}>Eliminar clase</Text>
                    <Text style={m.rowDesc}>Se borra del horario permanentemente</Text>
                  </View>
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

// ══════════════════════════════════════════════════════════════════
// TimeGrid
// ══════════════════════════════════════════════════════════════════
function TimeGrid({ entries, onLongPress }) {
  const hours  = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const totalH = hours.length * HOUR_H;
  const yOf    = (mins) => (mins - START_HOUR * 60) * HOUR_H / 60;
  const now    = nowMins();
  const showNow = now >= START_HOUR * 60 && now <= END_HOUR * 60;

  return (
    <View style={{ marginLeft: rs(52, 40, 62), marginRight: space.screen, position: 'relative', height: totalH + 20 }}>
      {hours.map(h => (
        <View key={h} style={[tg.hourRow, { top: yOf(h * 60) }]}>
          <Text style={tg.hourLbl}>{`${String(h).padStart(2,'0')}:00`}</Text>
          <View style={tg.hourLine}/>
        </View>
      ))}

      {entries.map(entry => {
        const sMins = timeToMins(entry.horaInicio);
        const eMins = timeToMins(entry.horaFin);
        const top   = yOf(sMins);
        const h     = Math.max((eMins - sMins) * HOUR_H / 60, HOUR_H * 0.55);
        const st    = autoStatus(entry.horaInicio, entry.horaFin);
        const pal   = PALETTE[entry.colorIdx] || PALETTE[0];
        const isDone = st === 'done';
        return (
          <TouchableOpacity
            key={entry.id}
            style={[tg.event,
              { top, height: h, backgroundColor: isDone ? '#F5F5F8' : pal.bg, borderLeftColor: isDone ? '#C8D0E0' : pal.border },
              st === 'active' && tg.eventActive,
            ]}
            onLongPress={() => onLongPress(entry)}
            delayLongPress={400}
            activeOpacity={0.8}>
            {st === 'active' && (
              <View style={tg.liveRow}>
                <View style={tg.liveDot}/>
                <Text style={tg.liveText}>En curso</Text>
              </View>
            )}
            <Text style={[tg.evName, { color: isDone ? '#AAB4C8' : pal.text }]} numberOfLines={1}>
              {entry.nombre}
            </Text>
            {entry.aula ? (
              <Text style={[tg.evMeta, { color: isDone ? '#C0C8D8' : `${pal.text}AA` }]} numberOfLines={1}>
                {entry.aula}
              </Text>
            ) : null}
            {h >= HOUR_H * 0.8 && (
              <Text style={[tg.evTime, { color: isDone ? '#C0C8D8' : `${pal.text}70` }]}>
                {entry.horaInicio} – {entry.horaFin}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {showNow && (
        <View style={[tg.nowLine, { top: yOf(now) }]}>
          <View style={tg.nowDot}/>
          <View style={tg.nowBar}/>
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// EntryForm
// ══════════════════════════════════════════════════════════════════
function EntryForm({ entry, paletteUsed, onBack, onSave }) {
  const isEdit = !!entry;
  const [form, setForm] = useState({
    nombre:     entry?.nombre     || '',
    aula:       entry?.aula       || '',
    horaInicio: entry?.horaInicio || '08:00',
    horaFin:    entry?.horaFin    || '09:00',
    dias:       entry?.dias       || [],
    colorIdx:   entry?.colorIdx   ?? pickColor(paletteUsed),
    notas:      entry?.notas      || '',
    ...(entry?.id ? { id: entry.id } : {}),
  });
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  const toggleDay = (i) => setForm(f => ({
    ...f, dias: f.dias.includes(i) ? f.dias.filter(d => d !== i) : [...f.dias, i],
  }));

  const openPicker = (mode) => {
    const [h, min] = (mode === 'start' ? form.horaInicio : form.horaFin).split(':').map(Number);
    const d = new Date(); d.setHours(h, min, 0, 0);
    setPickerDate(d); setPickerMode(mode);
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())       e.nombre  = 'El nombre es requerido';
    if (form.dias.length === 0)    e.dias    = 'Selecciona al menos un día';
    if (timeToMins(form.horaFin) <= timeToMins(form.horaInicio))
                                   e.horaFin = 'La hora de fin debe ser posterior';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const pal = PALETTE[form.colorIdx] || PALETTE[0];

  return (
    <View style={f.root}>
      <View style={f.header}>
        <TouchableOpacity style={f.backBtn} onPress={onBack}><BackIcon/></TouchableOpacity>
        <Text style={f.title}>{isEdit ? 'Editar clase' : 'Nueva clase'}</Text>
        <View style={{ width: clamp(W * 0.09, 36, 48) }}/>
      </View>

      <ScrollView contentContainerStyle={f.scroll} keyboardShouldPersistTaps="handled">

        {/* Nombre */}
        <Text style={f.label}>NOMBRE DE LA CLASE *</Text>
        <TextInput
          style={[f.input, errors.nombre && f.inputErr]}
          placeholder="Ej: Cálculo diferencial"
          placeholderTextColor="#aaa"
          value={form.nombre}
          onChangeText={t => { setForm(p => ({ ...p, nombre: t })); setErrors(e => ({ ...e, nombre: null })); }}
        />
        {errors.nombre && <Text style={f.err}>{errors.nombre}</Text>}

        {/* Aula */}
        <Text style={f.label}>AULA / LUGAR</Text>
        <TextInput
          style={f.input}
          placeholder="Ej: Lab B2, Aula 301"
          placeholderTextColor="#aaa"
          value={form.aula}
          onChangeText={t => setForm(p => ({ ...p, aula: t }))}
        />

        {/* Horario */}
        <Text style={f.label}>HORARIO</Text>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <TouchableOpacity style={[f.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
            onPress={() => openPicker('start')} activeOpacity={0.8}>
            <ClockIcon c={colors.primary}/>
            <Text style={{ fontSize: font.md, color: colors.primary, fontWeight: '700' }}>{form.horaInicio}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#C0C8D8', fontSize: font.md }}>–</Text>
          <TouchableOpacity style={[f.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, errors.horaFin && f.inputErr]}
            onPress={() => openPicker('end')} activeOpacity={0.8}>
            <ClockIcon c={errors.horaFin ? '#FF5252' : colors.primary}/>
            <Text style={{ fontSize: font.md, color: errors.horaFin ? '#FF5252' : colors.primary, fontWeight: '700' }}>
              {form.horaFin}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.horaFin && <Text style={f.err}>{errors.horaFin}</Text>}
        {pickerMode && (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour
            display="default"
            onChange={(_, selected) => {
              setPickerMode(null);
              if (selected) {
                const hh = String(selected.getHours()).padStart(2,'0');
                const mm = String(selected.getMinutes()).padStart(2,'0');
                const val = `${hh}:${mm}`;
                setForm(p => pickerMode === 'start' ? { ...p, horaInicio: val } : { ...p, horaFin: val });
                setErrors(e => ({ ...e, horaFin: null }));
              }
            }}
          />
        )}

        {/* Días */}
        <Text style={f.label}>DÍAS DE CLASE *</Text>
        <View style={f.daysRow}>
          {DAYS_LABELS.map((lbl, i) => (
            <TouchableOpacity
              key={i}
              style={[f.dayChip, form.dias.includes(i) && f.dayChipOn]}
              onPress={() => { toggleDay(i); setErrors(e => ({ ...e, dias: null })); }}>
              <Text style={[f.dayChipText, form.dias.includes(i) && f.dayChipTextOn]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.dias && <Text style={f.err}>{errors.dias}</Text>}

        {/* Color */}
        <Text style={f.label}>COLOR</Text>
        <View style={f.colorRow}>
          {PALETTE.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[f.colorCircle, { backgroundColor: p.border }, form.colorIdx === i && f.colorCircleOn]}
              onPress={() => setForm(fp => ({ ...fp, colorIdx: i }))}
            />
          ))}
        </View>

        {/* Preview tarjeta */}
        {!!form.nombre && (
          <View style={[f.preview, { backgroundColor: pal.bg, borderLeftColor: pal.border }]}>
            <Text style={[f.prevName, { color: pal.text }]} numberOfLines={1}>{form.nombre}</Text>
            {!!form.aula && <Text style={[f.prevMeta, { color: `${pal.text}99` }]}>{form.aula}</Text>}
            <Text style={[f.prevTime, { color: `${pal.text}80` }]}>{form.horaInicio} – {form.horaFin}</Text>
          </View>
        )}

        {/* Notas */}
        <Text style={f.label}>NOTAS (opcional)</Text>
        <TextInput
          style={[f.input, { height: rv(72,56,90), textAlignVertical: 'top' }]}
          placeholder="Ej: Llevar calculadora, revisar capítulo 3..."
          placeholderTextColor="#aaa"
          multiline
          value={form.notas}
          onChangeText={t => setForm(p => ({ ...p, notas: t }))}
        />

        <TouchableOpacity
          style={[f.btn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color={colors.primary}/>
            : <Text style={f.btnText}>{isEdit ? 'Guardar cambios ✓' : 'Agregar al horario →'}</Text>
          }
        </TouchableOpacity>
        <View style={{ height: rv(36, 24, 52) }}/>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: space.screen, paddingTop: rv(16,12,20), paddingBottom: rv(8,5,12) },
  title:           { fontSize: clamp(W*0.06,20,28), fontWeight: '800', color: colors.primary },
  monthBadge:      { backgroundColor: '#EEF1FA', paddingHorizontal: rs(10,7,14),
                     paddingVertical: rv(4,2,6), borderRadius: radius.full },
  monthText:       { fontSize: font.xs, fontWeight: '700', color: colors.primary },
  weekRow:         { flexDirection: 'row', paddingHorizontal: space.screen, marginBottom: rv(8,5,12) },
  dayCol:          { flex: 1, alignItems: 'center', gap: rv(3,2,5) },
  dayLbl:          { fontSize: font.xs, fontWeight: '600', color: '#B0BAD0' },
  dayLblActive:    { color: colors.primary },
  dayNumWrap:      { width: clamp(W*0.08,28,38), height: clamp(W*0.08,28,38),
                     borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dayNumActive:    { backgroundColor: colors.primary },
  dayNumToday:     { backgroundColor: `${colors.accent}30` },
  dayNumText:      { fontSize: font.sm, fontWeight: '600', color: '#8A9CC2' },
  dayNumTextActive:{ color: '#fff', fontWeight: '800' },
  dayNumTextToday: { color: colors.primary, fontWeight: '800' },
  todayDot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  divider:         { height: 1, backgroundColor: '#E8ECF4', marginBottom: rv(4,2,8) },
  gridScroll:      { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: rv(60,40,80) },
  emptyIcon:       { fontSize: 44, marginBottom: rv(12,8,16) },
  emptyTitle:      { fontSize: font.lg, fontWeight: '800', color: colors.primary, marginBottom: rv(6,4,8) },
  emptySub:        { fontSize: font.sm, color: '#8A9CC2', textAlign: 'center', paddingHorizontal: space.xl },
  fab:             {
    position: 'absolute', right: rs(20,14,28),
    width: clamp(W*0.13,48,60), height: clamp(W*0.13,48,60),
    borderRadius: radius.lg, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8,
  },
});

const tg = StyleSheet.create({
  hourRow:     { position: 'absolute', left: -rs(52,40,62), right: 0, flexDirection: 'row', alignItems: 'center' },
  hourLbl:     { width: rs(42,32,50), fontSize: font.xs, color: '#B0BAD0', textAlign: 'right', paddingRight: rs(8,6,10) },
  hourLine:    { flex: 1, height: 0.5, backgroundColor: '#E8ECF4' },
  event:       { position: 'absolute', left: 4, right: 0, borderRadius: radius.sm, borderLeftWidth: 3,
                 paddingHorizontal: rs(10,7,13), paddingVertical: rv(5,3,7), overflow: 'hidden' },
  eventActive: { elevation: 3, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
  evName:      { fontSize: font.sm, fontWeight: '700' },
  evMeta:      { fontSize: font.xs, marginTop: 1 },
  evTime:      { fontSize: font.xs, marginTop: 2 },
  liveRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', top: rv(5,3,7), right: rs(8,6,10) },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  liveText:    { fontSize: font.xs, fontWeight: '700', color: '#2E7D32' },
  nowLine:     { position: 'absolute', left: -rs(52,40,62), right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  nowDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF5350', marginLeft: rs(37,28,47) },
  nowBar:      { flex: 1, height: 1.5, backgroundColor: '#EF5350' },
});

const m = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
               paddingHorizontal: space.screen, paddingBottom: rv(32,20,44), paddingTop: rv(12,8,18) },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: rv(12,8,18) },
  colorBar:  { width: 28, height: 4, borderRadius: 2, marginBottom: rv(8,5,10) },
  sheetTitle:{ fontSize: font.lg, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  sheetSub:  { fontSize: font.sm, color: '#8A9CC2', marginBottom: rv(16,10,22) },
  row:       { flexDirection: 'row', alignItems: 'center', gap: rs(14,10,18),
               paddingVertical: rv(14,10,18), borderBottomWidth: 0.5, borderBottomColor: '#F0F0F5' },
  rowIcon:   { width: clamp(W*0.11,40,52), height: clamp(W*0.11,40,52), borderRadius: radius.md,
               backgroundColor: '#F5F5F8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowInfo:   { flex: 1 },
  rowTitle:  { fontSize: font.md, fontWeight: '700', color: colors.primary },
  rowDesc:   { fontSize: font.xs, color: '#8A9CC2', marginTop: 2 },
  cancelBtn: { marginTop: rv(14,10,20), alignItems: 'center', paddingVertical: rv(12,8,16) },
  cancelText:{ fontSize: font.md, color: '#8A9CC2', fontWeight: '600' },
});

const f = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fff' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: space.screen, paddingTop: rv(16,12,20),
                   paddingBottom: rv(12,8,16), borderBottomWidth: 0.5, borderBottomColor: '#E8ECF4' },
  backBtn:       { width: clamp(W*0.09,36,48), height: clamp(W*0.09,36,48),
                   borderRadius: radius.sm, backgroundColor: '#F5F5F8',
                   alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  scroll:        { padding: space.screen },
  label:         { fontSize: font.xs, fontWeight: '700', color: '#888',
                   letterSpacing: 1, marginBottom: rv(6,4,8), marginTop: rv(14,10,18) },
  input:         { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: radius.sm,
                   padding: rs(13,10,16), backgroundColor: '#FAFAFA',
                   minHeight: clamp(H*0.055,44,56), justifyContent: 'center' },
  inputErr:      { borderColor: '#FF5252' },
  err:           { fontSize: font.xs, color: '#FF5252', marginTop: rv(4,2,6) },
  daysRow:       { flexDirection: 'row', gap: rs(5,3,7) },
  dayChip:       { flex: 1, paddingVertical: rv(10,7,13), borderRadius: radius.sm,
                   borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', backgroundColor: '#FAFAFA' },
  dayChipOn:     { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText:   { fontSize: font.xs, fontWeight: '700', color: '#999' },
  dayChipTextOn: { color: '#fff' },
  colorRow:      { flexDirection: 'row', gap: rs(8,6,10), flexWrap: 'wrap' },
  colorCircle:   { width: clamp(W*0.07,26,34), height: clamp(W*0.07,26,34), borderRadius: radius.full,
                   borderWidth: 2.5, borderColor: 'transparent' },
  colorCircleOn: { borderColor: colors.primary, transform: [{scale: 1.15}] },
  preview:       { marginTop: rv(14,10,18), borderRadius: radius.sm, borderLeftWidth: 3, padding: rs(12,9,16) },
  prevName:      { fontSize: font.sm, fontWeight: '700' },
  prevMeta:      { fontSize: font.xs, marginTop: 2 },
  prevTime:      { fontSize: font.xs, marginTop: 2 },
  btn:           { backgroundColor: colors.accent, paddingVertical: rv(16,12,20),
                   borderRadius: radius.md, alignItems: 'center', marginTop: rv(24,16,32) },
  btnText:       { color: colors.primary, fontWeight: '800', fontSize: font.md },
});
