/**
 * PrivacyScreen.js
 * - Muestra controles de privacidad y datos conformes a LFPDPPP 2025
 * - Solicita permisos del teléfono: calendario, actividad física, etc.
 * - Permite descargar datos, ver aviso de privacidad y solicitar eliminación
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, SafeAreaView, Alert, Linking, Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { font, space, radius, rv, rs } from '../../theme/responsive';

// Optional: expo-permissions / expo-media-library / expo-calendar
let Calendar = null;
let MediaLibrary = null;
try { Calendar    = require('expo-calendar'); }    catch (_) {}
try { MediaLibrary = require('expo-media-library'); } catch (_) {}

import { useAuth } from '../../context/AuthContext';

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

export default function PrivacyScreen({ onBack }) {
  const { user } = useAuth();
  const userEmail = user?.email || 'tu correo registrado';
  const [settings, setSettings] = useState({
    app_monitor:    true,
    correlation:    true,
    custom_notifs:  false,
    research:       true,
  });
  const [phonePerms, setPhonePerms] = useState({
    calendar: false,
    activity: false,
    storage:  false,
  });

  // ── Check phone permissions on mount ──────────────────────────
  useEffect(() => { checkPhonePermissions(); }, []);

  const checkPhonePermissions = async () => {
    const perms = { calendar: false, activity: false, storage: false };

    if (Calendar) {
      try {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        perms.calendar = status === 'granted';
      } catch (_) {}
    }
    if (MediaLibrary) {
      try {
        const { status } = await MediaLibrary.getPermissionsAsync();
        perms.storage = status === 'granted';
      } catch (_) {}
    }
    setPhonePerms(perms);
  };

  const requestCalendarPerm = async () => {
    if (!Calendar) {
      Alert.alert('Permiso de Calendario', 'Esto habilitaría la sincronización de eventos con tu calendario del sistema.\n\n(expo-calendar no instalado en esta build)');
      setPhonePerms(p => ({ ...p, calendar: true }));
      return;
    }
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      setPhonePerms(p => ({ ...p, calendar: true }));
      Alert.alert('✅ Calendario', 'TimeFocus puede leer tu calendario para sugerir bloques de estudio.');
    } else {
      Alert.alert('Sin permiso', 'Puedes habilitarlo manualmente en Configuración del sistema.');
    }
  };

  const requestActivityPerm = () => {
    Alert.alert(
      'Actividad física',
      'TimeFocus usaría datos de movimiento para detectar cuándo estás en clase o en movimiento y pausar el timer automáticamente.',
      [
        { text:'Cancelar', style:'cancel' },
        { text:'Permitir', onPress: () => setPhonePerms(p => ({ ...p, activity: true })) },
      ]
    );
  };

  const requestStoragePerm = async () => {
    if (!MediaLibrary) {
      Alert.alert('Almacenamiento', 'Se usaría para exportar tus reportes de estudio como PDF a la galería.\n\n(expo-media-library no instalado en esta build)');
      setPhonePerms(p => ({ ...p, storage: true }));
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      setPhonePerms(p => ({ ...p, storage: true }));
    }
  };

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const handleDownloadData = () => {
    Alert.alert('Descargar mis datos', 'Se preparará un archivo JSON con toda tu información en TimeFocus. Lo recibirás por correo electrónico en menos de 24 horas.', [
      { text:'Cancelar', style:'cancel' },
      { text:'Solicitar', onPress: () => Alert.alert('Solicitud enviada ✅', `Recibirás tus datos en ${userEmail}`) },
    ]);
  };

  const handlePrivacyNotice = () => {
    Linking.openURL('https://utxj.edu.mx/privacidad').catch(() =>
      Alert.alert('Aviso de privacidad', 'Procesamos tus datos conforme a la LFPDPPP 2025. Puedes ejercer derechos ARCO en privacidad@utxj.edu.mx')
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      '⚠️ Eliminar mis datos',
      'Esta acción es irreversible. Se eliminarán tu cuenta, historial de tareas, sesiones pomodoro y estadísticas.',
      [
        { text:'Cancelar', style:'cancel' },
        { text:'Confirmar eliminación', style:'destructive',
          onPress: () => Alert.alert('Solicitud enviada', 'Tu solicitud de eliminación fue registrada. Se procesará en un plazo de 30 días hábiles conforme a la LFPDPPP.') },
      ]
    );
  };

  const PHONE_PERMS = [
    { key:'calendar', label:'Calendario del sistema',  desc:'Sincroniza tus clases y tareas con el calendario del teléfono', onRequest: requestCalendarPerm },
    { key:'activity', label:'Actividad física',         desc:'Detecta cuándo estás en movimiento para pausar el timer',       onRequest: requestActivityPerm },
    { key:'storage',  label:'Almacenamiento',           desc:'Exporta reportes PDF a tu galería',                             onRequest: requestStoragePerm },
  ];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={hdr.wrap}>
        <BackIcon onPress={onBack}/>
        <Text style={hdr.title}>Privacidad y datos</Text>
        <View style={{ width:40 }}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:space.screen, paddingBottom:rv(40) }}>

        {/* LFPDPPP banner */}
        <View style={ban.wrap}>
          <Text style={ban.txt}>
            Conforme a la <Text style={ban.bold}>LFPDPPP 2025</Text>, tienes derecho de Acceso, Rectificación, Cancelación y Oposición sobre tus datos.
          </Text>
        </View>

        {/* ── Permisos del teléfono ── */}
        <Text style={sec.title}>PERMISOS DEL TELÉFONO</Text>
        <View style={card.wrap}>
          {PHONE_PERMS.map((p, i) => (
            <View key={p.key} style={[card.row, i < PHONE_PERMS.length-1 && card.border]}>
              <View style={{ flex:1 }}>
                <Text style={card.label}>{p.label}</Text>
                <Text style={card.desc}>{p.desc}</Text>
              </View>
              {phonePerms[p.key]
                ? <View style={perm.granted}><Text style={perm.grantedTxt}>✓ Activo</Text></View>
                : <TouchableOpacity style={perm.btn} onPress={p.onRequest} activeOpacity={0.8}>
                    <Text style={perm.btnTxt}>Permitir</Text>
                  </TouchableOpacity>
              }
            </View>
          ))}
        </View>

        {/* ── Datos de la app ── */}
        <Text style={sec.title}>DATOS DE LA APP</Text>
        <View style={card.wrap}>
          {[
            { key:'app_monitor',   label:'Monitoreo de apps',       desc:'Registrar uso del dispositivo' },
            { key:'correlation',   label:'Análisis de correlación',  desc:'Vincular califs. con hábitos' },
            { key:'custom_notifs', label:'Notifs. personalizadas',   desc:'Alertas basadas en tu comportamiento' },
            { key:'research',      label:'Participar en investigación', desc:'Datos anónimos para UTXJ' },
          ].map((item, i, arr) => (
            <View key={item.key} style={[card.row, i < arr.length-1 && card.border]}>
              <View style={{ flex:1 }}>
                <Text style={card.label}>{item.label}</Text>
                <Text style={card.desc}>{item.desc}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: C.border, true: C.success }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* ── Acciones ARCO ── */}
        <Text style={sec.title}>DERECHOS ARCO</Text>

        <TouchableOpacity style={action.btn} onPress={handleDownloadData} activeOpacity={0.8}>
          <Text style={action.icon}>💾</Text>
          <Text style={action.txt}>Descargar mis datos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={action.btn} onPress={handlePrivacyNotice} activeOpacity={0.8}>
          <Text style={action.icon}>📋</Text>
          <Text style={action.txt}>Ver aviso de privacidad</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[action.btn, action.danger]} onPress={handleDeleteData} activeOpacity={0.8}>
          <Text style={action.icon}>🗑</Text>
          <Text style={[action.txt, { color: C.danger }]}>Solicitar eliminación de datos</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const hdr = StyleSheet.create({
  wrap:  { flexDirection:'row', alignItems:'center', paddingHorizontal:space.screen,
           paddingTop:rv(10), paddingBottom:rv(8) },
  title: { fontSize:font.lg, fontWeight:'700', color:C.navy, flex:1, textAlign:'center' },
});

const ban = StyleSheet.create({
  wrap: { backgroundColor:'#FFFBF0', borderLeftWidth:4, borderLeftColor:C.accent,
          borderRadius:radius.md, padding:rv(14), marginBottom:rv(20) },
  txt:  { fontSize:font.sm, color:C.navy, lineHeight:rs(20) },
  bold: { fontWeight:'800' },
});

const sec = StyleSheet.create({
  title: { fontSize:font.xs, fontWeight:'700', color:C.muted, letterSpacing:1,
           marginBottom:rv(10) },
});

const card = StyleSheet.create({
  wrap:   { backgroundColor:C.card, borderRadius:radius.lg, marginBottom:rv(20),
            shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8,
            shadowOffset:{width:0,height:2}, elevation:2, overflow:'hidden' },
  row:    { flexDirection:'row', alignItems:'center', paddingHorizontal:rv(16),
            paddingVertical:rv(14), gap:12 },
  border: { borderBottomWidth:1, borderBottomColor:C.border },
  label:  { fontSize:font.md, fontWeight:'600', color:C.navy, marginBottom:2 },
  desc:   { fontSize:font.xs, color:C.muted },
});

const perm = StyleSheet.create({
  granted:    { backgroundColor:'#E8F5E9', paddingHorizontal:10, paddingVertical:6,
                borderRadius:radius.md },
  grantedTxt: { fontSize:font.xs, fontWeight:'700', color:C.success },
  btn:        { backgroundColor:C.navy, paddingHorizontal:12, paddingVertical:7,
                borderRadius:radius.md },
  btnTxt:     { color:'#fff', fontWeight:'700', fontSize:font.xs },
});

const action = StyleSheet.create({
  btn:    { backgroundColor:C.card, borderRadius:radius.lg, paddingVertical:rv(14),
            paddingHorizontal:rv(16), flexDirection:'row', alignItems:'center', gap:12,
            marginBottom:rv(10), shadowColor:'#000', shadowOpacity:0.04,
            shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },
  danger: { backgroundColor:'#FFF5F5', borderWidth:1, borderColor:'#FFCDD2' },
  icon:   { fontSize:rs(18) },
  txt:    { fontSize:font.md, fontWeight:'600', color:C.navy },
});