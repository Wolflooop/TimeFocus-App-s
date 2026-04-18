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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const { signIn } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null, general: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.email) e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo no válido';
    if (!form.password) e.password = 'La contraseña es requerida';
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!form.confirm) e.confirm = 'Confirma tu contraseña';
    else if (form.confirm !== form.password) e.confirm = 'Las contraseñas no coinciden';
    if (!termsAccepted) e.terms = 'Debes aceptar los Términos y Condiciones';
    setErrors(e);
    if (Object.keys(e).length > 0) shake();
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const nameParts = form.name.trim().split(' ');
      const data = await register({
        nombre: nameParts[0],
        apellido_paterno: nameParts[1] || 'N/A',
        email: form.email,
        password: form.password,
        id_carrera: 1,
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
            <ScrollView style={s.modalScroll} onScroll={handleTermsScroll} scrollEventThrottle={16}>
              {[
                ['1. ACEPTACIÓN', 'Al utilizar TimeFocus, aceptas estos Términos. Si no estás de acuerdo, no uses la aplicación.'],
                ['2. DATOS RECOPILADOS', 'Solo recopilamos datos académicos: tiempo de uso por app, sesiones de estudio, tareas y horarios. Nunca compartimos datos con terceros.'],
                ['3. PERMISOS', 'PACKAGE_USAGE_STATS: monitoreo de uso de apps (activación manual en Ajustes). INTERNET: sincronización con el servidor. Puedes revocarlos en cualquier momento.'],
                ['4. USO ACEPTABLE', 'Úsala solo para fines académicos. No compartas credenciales. Proporciona información verídica. No realices ingeniería inversa.'],
                ['5. SEGURIDAD', 'Contraseñas encriptadas con bcrypt. Tokens con expiración de 7 días. Comunicaciones vía HTTPS.'],
                ['6. RETENCIÓN DE DATOS', 'Datos conservados durante el ciclo escolar. Al eliminar tu cuenta, todos los datos se eliminan en máximo 30 días.'],
                ['7. LIMITACIÓN DE RESPONSABILIDAD', 'Servicio "tal cual". No garantizamos disponibilidad continua ni nos responsabilizamos por pérdidas externas.'],
                ['8. MENORES DE EDAD', 'Dirigida a mayores de 18 años. Menores requieren consentimiento de tutor legal.'],
                ['9. MODIFICACIONES', 'Podemos modificar estos términos. Los cambios se notifican en la app. El uso continuado implica aceptación.'],
                ['10. CONTACTO', 'soporte@timefocus.utxj.edu.mx'],
              ].map(([title, body]) => (
                <View key={title}>
                  <Text style={s.tSection}>{title}</Text>
                  <Text style={s.tBody}>{body}</Text>
                </View>
              ))}
              <View style={s.tEnd}><Text style={s.tEndText}>— Fin de los Términos —</Text></View>
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={[s.acceptBtn, !scrolledToEnd && s.acceptBtnDisabled]}
                onPress={() => { setTermsAccepted(true); setErrors(e => ({ ...e, terms: null })); setShowTermsModal(false); }}
                disabled={!scrolledToEnd}>
                <Text style={[s.acceptBtnText, !scrolledToEnd && { color: '#aaa' }]}>
                  Aceptar Términos y Condiciones
                </Text>
              </TouchableOpacity>
              {!scrolledToEnd && <Text style={s.modalHint}>Lee hasta el final para habilitar</Text>}
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={s.backRow} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Regístrate para comenzar</Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Text style={s.label}>NOMBRE COMPLETO</Text>
            <TextInput style={[s.input, errors.name && s.inputError]} placeholder="Tu nombre completo"
              placeholderTextColor="#aaa" value={form.name} onChangeText={t => update('name', t)} />
            {errors.name && <Text style={s.error}>{errors.name}</Text>}

            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <TextInput style={[s.input, errors.email && s.inputError]} placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa" value={form.email} onChangeText={t => update('email', t)}
              keyboardType="email-address" autoCapitalize="none" />
            {errors.email && <Text style={s.error}>{errors.email}</Text>}

            <Text style={s.label}>CONTRASEÑA</Text>
            <View style={s.passRow}>
              <TextInput style={[s.input, { flex: 1 }, errors.password && s.inputError]}
                placeholder="••••••••" placeholderTextColor="#aaa" value={form.password}
                onChangeText={t => update('password', t)} secureTextEntry={!showPass} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <EyeIcon visible={showPass} size={W * 0.045} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.error}>{errors.password}</Text>}

            <Text style={s.label}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput style={[s.input, errors.confirm && s.inputError]} placeholder="••••••••"
              placeholderTextColor="#aaa" value={form.confirm}
              onChangeText={t => update('confirm', t)} secureTextEntry={!showPass} />
            {errors.confirm && <Text style={s.error}>{errors.confirm}</Text>}
            {errors.general && <Text style={s.error}>{errors.general}</Text>}
          </Animated.View>

          <View style={s.dividerRow}>
            <View style={s.divider} /><Text style={s.dividerText}>o continúa con</Text><View style={s.divider} />
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
            <Text style={s.termsText}>
              Acepto los{' '}
              <Text style={s.termsLink} onPress={() => { setScrolledToEnd(false); setShowTermsModal(true); }}>
                Términos y Condiciones
              </Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={[s.error, { marginTop: -H * 0.01 }]}>{errors.terms}</Text>}

          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Crear cuenta</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.loginRow} onPress={() => navigation.goBack()}>
            <Text style={s.loginText}>¿Ya tienes cuenta? <Text style={s.loginLink}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: W * 0.06, paddingTop: H * 0.06, paddingBottom: H * 0.04 },
  backRow: { marginBottom: H * 0.025 },
  backText: { fontSize: W * 0.035, color: '#1A2035', fontWeight: '600' },
  title: { fontSize: W * 0.07, fontWeight: '800', color: '#1A2035', marginBottom: H * 0.005 },
  subtitle: { fontSize: W * 0.035, color: '#888', marginBottom: H * 0.03 },
  label: { fontSize: W * 0.025, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: H * 0.008 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: W * 0.025,
    paddingHorizontal: W * 0.04, paddingVertical: H * 0.016,
    fontSize: W * 0.038, color: '#1A2035', backgroundColor: '#FAFAFA', marginBottom: H * 0.008,
  },
  inputError: { borderColor: '#FF5252' },
  error: { fontSize: W * 0.03, color: '#FF5252', marginBottom: H * 0.01 },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: W * 0.03, padding: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: H * 0.02, marginTop: H * 0.01 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: W * 0.03, color: '#aaa', marginHorizontal: W * 0.03 },
  btnGoogle: {
    borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: H * 0.016,
    borderRadius: W * 0.03, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: W * 0.025, marginBottom: H * 0.02,
  },
  btnGoogleText: { fontSize: W * 0.038, color: '#1A2035', fontWeight: '500' },
  termsRow: {
    flexDirection: 'row', alignItems: 'center', gap: W * 0.025,
    marginBottom: H * 0.02, padding: W * 0.03,
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: W * 0.025, backgroundColor: '#FAFAFA',
  },
  termsRowError: { borderColor: '#FF5252', backgroundColor: '#FFF5F5' },
  checkbox: {
    width: W * 0.055, height: W * 0.055, borderRadius: W * 0.01,
    borderWidth: 1.5, borderColor: '#1A2035', alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#1A2035' },
  checkmark: { color: '#fff', fontSize: W * 0.032, fontWeight: '700' },
  termsText: { flex: 1, fontSize: W * 0.032, color: '#444' },
  termsLink: { color: '#1A2035', fontWeight: '700', textDecorationLine: 'underline' },
  btnPrimary: {
    backgroundColor: '#1A2035', paddingVertical: H * 0.018,
    borderRadius: W * 0.03, alignItems: 'center', marginBottom: H * 0.02,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: W * 0.04, fontWeight: '700' },
  loginRow: { alignItems: 'center', marginBottom: H * 0.03 },
  loginText: { fontSize: W * 0.033, color: '#888' },
  loginLink: { color: '#1A2035', fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: W * 0.05, borderTopRightRadius: W * 0.05, height: H * 0.88 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: W * 0.05, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: W * 0.045, fontWeight: '800', color: '#1A2035' },
  modalSubtitle: { fontSize: W * 0.028, color: '#aaa', marginTop: 2 },
  closeBtn: { width: W * 0.08, height: W * 0.08, borderRadius: W * 0.04, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: W * 0.032, color: '#666', fontWeight: '700' },
  scrollHint: { backgroundColor: '#FFF8E1', paddingVertical: H * 0.01, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#F5BF23' },
  scrollHintText: { fontSize: W * 0.028, color: '#7A5F00', fontWeight: '600' },
  modalScroll: { flex: 1, paddingHorizontal: W * 0.05 },
  tSection: { fontSize: W * 0.03, fontWeight: '800', color: '#1A2035', marginTop: H * 0.02, marginBottom: H * 0.008 },
  tBody: { fontSize: W * 0.032, color: '#444', lineHeight: W * 0.048 },
  tEnd: { marginVertical: H * 0.03, alignItems: 'center' },
  tEndText: { fontSize: W * 0.028, color: '#aaa' },
  modalFooter: { padding: W * 0.04, borderTopWidth: 0.5, borderTopColor: '#E0E0E0' },
  acceptBtn: { backgroundColor: '#1A2035', paddingVertical: H * 0.018, borderRadius: W * 0.03, alignItems: 'center' },
  acceptBtnDisabled: { backgroundColor: '#E0E0E0' },
  acceptBtnText: { color: '#F5BF23', fontWeight: '800', fontSize: W * 0.04 },
  modalHint: { textAlign: 'center', fontSize: W * 0.028, color: '#aaa', marginTop: H * 0.01 },
});