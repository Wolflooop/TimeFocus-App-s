// src/screens/auth/RegisterScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Dimensions, StatusBar, Modal
} from 'react-native';
import { colors } from '../../theme/colors';
import { register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import GoogleIcon from '../../components/icons/GoogleIcon';
import EyeIcon from '../../components/icons/EyeIcon';

const { width: W, height: H } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [showPass,       setShowPass]       = useState(false);
  const [errors,         setErrors]         = useState({});
  const [loading,        setLoading]        = useState(false);
  const [termsAccepted,  setTermsAccepted]  = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [scrolledToEnd,  setScrolledToEnd]  = useState(false);
  const { signIn }   = useAuth();
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null, general: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())           e.nombre = 'El nombre es requerido';
    if (!form.apellido_paterno.trim()) e.apellido_paterno = 'El apellido es requerido';
    if (!form.email)                   e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo no válido';
    if (!form.password)                e.password = 'La contraseña es requerida';
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!form.confirm)                 e.confirm = 'Confirma tu contraseña';
    else if (form.confirm !== form.password) e.confirm = 'Las contraseñas no coinciden';
    if (!termsAccepted)                e.terms = 'Debes aceptar los Términos y Condiciones';
    setErrors(e);
    if (Object.keys(e).length > 0) shake();
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register({
        nombre:           form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        email:            form.email.trim().toLowerCase(),
        password:         form.password,
        id_carrera:       1,
      });
      signIn(data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear cuenta';
      setErrors({ general: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleTermsScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setScrolledToEnd(true);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Modal Términos */}
      <Modal visible={showTermsModal} animationType="slide" transparent onRequestClose={() => setShowTermsModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Términos y Condiciones</Text>
                <Text style={s.modalSubtitle}>TimeFocus · v1.0 · UTXJ 2026</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {!scrolledToEnd && (
              <View style={s.scrollHint}>
                <Text style={s.scrollHintText}>↓ Baja hasta el final para aceptar</Text>
              </View>
            )}
            <ScrollView
              style={s.termsScroll}
              onScroll={handleTermsScroll}
              scrollEventThrottle={16}>
              <Text style={s.termsText}>
                {`Al registrarte en TimeFocus aceptas los siguientes términos:\n\n`}
                {`1. USO PERSONAL\nTimeFocus es una herramienta de productividad académica para uso personal. No puedes compartir tu cuenta ni usarla con fines comerciales.\n\n`}
                {`2. DATOS PERSONALES\nGuardamos tu nombre, correo y datos de sesiones de estudio para ofrecerte estadísticas personalizadas. No vendemos tus datos a terceros.\n\n`}
                {`3. SEGURIDAD\nEres responsable de mantener tu contraseña segura. Notifícanos si detectas acceso no autorizado.\n\n`}
                {`4. CONTENIDO\nNo uses la plataforma para actividades ilegales o que violen derechos de terceros.\n\n`}
                {`5. CAMBIOS\nPodemos actualizar estos términos. Te avisaremos por correo ante cambios importantes.\n\n`}
                {`6. CONTACTO\nDudas: soporte@timefocus.com\n\nÚltima actualización: abril 2026`}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[s.acceptBtn, !scrolledToEnd && s.acceptBtnDisabled]}
              disabled={!scrolledToEnd}
              onPress={() => { setTermsAccepted(true); setShowTermsModal(false); }}>
              <Text style={s.acceptBtnText}>Aceptar y continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backRow} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={s.title}>Crear cuenta</Text>
        <Text style={s.subtitle}>Únete a TimeFocus · UTXJ</Text>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }}>

          {/* Nombre */}
          <Text style={s.label}>NOMBRE</Text>
          <TextInput
            style={[s.input, errors.nombre && s.inputError]}
            placeholder="Tu nombre"
            placeholderTextColor="#aaa"
            value={form.nombre}
            onChangeText={t => update('nombre', t)}
            autoCapitalize="words"
          />
          {errors.nombre && <Text style={s.error}>{errors.nombre}</Text>}

          {/* Apellido paterno */}
          <Text style={s.label}>APELLIDO PATERNO</Text>
          <TextInput
            style={[s.input, errors.apellido_paterno && s.inputError]}
            placeholder="Tu apellido paterno"
            placeholderTextColor="#aaa"
            value={form.apellido_paterno}
            onChangeText={t => update('apellido_paterno', t)}
            autoCapitalize="words"
          />
          {errors.apellido_paterno && <Text style={s.error}>{errors.apellido_paterno}</Text>}

          {/* Email */}
          <Text style={s.label}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={[s.input, errors.email && s.inputError]}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#aaa"
            value={form.email}
            onChangeText={t => update('email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={s.error}>{errors.email}</Text>}

          {/* Contraseña */}
          <Text style={s.label}>CONTRASEÑA</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, { flex: 1 }, errors.password && s.inputError]}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              value={form.password}
              onChangeText={t => update('password', t)}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <EyeIcon visible={showPass} size={W * 0.045} color="#888" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={s.error}>{errors.password}</Text>}

          {/* Confirmar contraseña */}
          <Text style={s.label}>CONFIRMAR CONTRASEÑA</Text>
          <TextInput
            style={[s.input, errors.confirm && s.inputError]}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={form.confirm}
            onChangeText={t => update('confirm', t)}
            secureTextEntry={!showPass}
          />
          {errors.confirm && <Text style={s.error}>{errors.confirm}</Text>}
          {errors.general && <Text style={s.error}>{errors.general}</Text>}
        </Animated.View>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.divider} />
          <Text style={s.dividerText}>o continúa con</Text>
          <View style={s.divider} />
        </View>
        <TouchableOpacity style={s.btnGoogle}>
          <GoogleIcon size={W * 0.05} />
          <Text style={s.btnGoogleText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Checkbox términos */}
        <TouchableOpacity
          style={[s.termsRow, errors.terms && s.termsRowError]}
          onPress={() => { setScrolledToEnd(false); setShowTermsModal(true); }}
          activeOpacity={0.7}>
          <View style={[s.checkbox, termsAccepted && s.checkboxActive]}>
            {termsAccepted && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.termsRowText}>
            Acepto los{' '}
            <Text style={s.termsLink}>Términos y Condiciones</Text>
          </Text>
        </TouchableOpacity>
        {errors.terms && <Text style={[s.error, { marginTop: 4 }]}>{errors.terms}</Text>}

        {/* Botón crear cuenta */}
        <TouchableOpacity
          style={[s.btnPrimary, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryText}>Crear cuenta</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.loginRow} onPress={() => navigation.goBack()}>
          <Text style={s.loginText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={s.loginLink}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  content:          { paddingHorizontal: W * 0.06, paddingTop: H * 0.06, paddingBottom: H * 0.06 },
  backRow:          { marginBottom: H * 0.025 },
  backText:         { fontSize: W * 0.035, color: '#1A2035', fontWeight: '600' },
  title:            { fontSize: W * 0.07, fontWeight: '800', color: '#1A2035', marginBottom: H * 0.005 },
  subtitle:         { fontSize: W * 0.035, color: '#888', marginBottom: H * 0.03 },
  label:            { fontSize: W * 0.025, fontWeight: '700', color: '#888', letterSpacing: 1,
                      marginBottom: H * 0.008, marginTop: H * 0.018 },
  input:            { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
                      paddingHorizontal: W * 0.04, paddingVertical: H * 0.015,
                      fontSize: W * 0.038, color: '#1A2035', backgroundColor: '#F8FAFF' },
  inputError:       { borderColor: '#FF5252' },
  passRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:           { padding: 10 },
  error:            { color: '#FF5252', fontSize: W * 0.03, marginTop: 4, fontWeight: '600' },
  dividerRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: H * 0.025 },
  divider:          { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText:      { fontSize: W * 0.03, color: '#999', fontWeight: '600' },
  btnGoogle:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                      borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
                      paddingVertical: H * 0.016, backgroundColor: '#fff',
                      marginBottom: H * 0.02 },
  btnGoogleText:    { fontSize: W * 0.038, fontWeight: '700', color: '#1A2035' },
  termsRow:         { flexDirection: 'row', alignItems: 'center', gap: 10,
                      backgroundColor: '#F8FAFF', borderRadius: 10,
                      padding: W * 0.035, borderWidth: 1, borderColor: '#E0E0E0',
                      marginBottom: H * 0.01 },
  termsRowError:    { borderColor: '#FF5252' },
  checkbox:         { width: 20, height: 20, borderRadius: 5, borderWidth: 2,
                      borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  checkboxActive:   { backgroundColor: '#1A2035', borderColor: '#1A2035' },
  checkmark:        { color: '#fff', fontSize: 13, fontWeight: '800' },
  termsRowText:     { flex: 1, fontSize: W * 0.033, color: '#555' },
  termsLink:        { color: '#1A2035', fontWeight: '700', textDecorationLine: 'underline' },
  btnPrimary:       { backgroundColor: '#1A2035', borderRadius: 14,
                      paddingVertical: H * 0.018, alignItems: 'center', marginTop: H * 0.02 },
  btnDisabled:      { opacity: 0.6 },
  btnPrimaryText:   { color: '#fff', fontWeight: '800', fontSize: W * 0.042 },
  loginRow:         { alignItems: 'center', marginTop: H * 0.02 },
  loginText:        { fontSize: W * 0.035, color: '#888' },
  loginLink:        { color: '#1A2035', fontWeight: '700', textDecorationLine: 'underline' },
  // Modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                      maxHeight: H * 0.75, padding: W * 0.05 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 12 },
  modalTitle:       { fontSize: W * 0.045, fontWeight: '800', color: '#1A2035' },
  modalSubtitle:    { fontSize: W * 0.03, color: '#888', marginTop: 2 },
  closeBtn:         { padding: 6 },
  closeBtnText:     { fontSize: 18, color: '#888' },
  scrollHint:       { backgroundColor: '#FFF9E6', borderRadius: 8, padding: 8, marginBottom: 8 },
  scrollHintText:   { fontSize: W * 0.03, color: '#F59E0B', textAlign: 'center', fontWeight: '600' },
  termsScroll:      { maxHeight: H * 0.45 },
  termsText:        { fontSize: W * 0.033, color: '#444', lineHeight: W * 0.05 },
  acceptBtn:        { backgroundColor: '#1A2035', borderRadius: 12,
                      paddingVertical: H * 0.016, alignItems: 'center', marginTop: 16 },
  acceptBtnDisabled:{ backgroundColor: '#CCC' },
  acceptBtnText:    { color: '#fff', fontWeight: '800', fontSize: W * 0.038 },
});
