import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Dimensions, StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import GoogleIcon from '../../components/icons/GoogleIcon';
import EyeIcon from '../../components/icons/EyeIcon';

const { width: W, height: H } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── DEV ONLY: exponer signIn para consola ─────────────
  React.useEffect(() => {
    if (__DEV__) {
      globalThis.__authSignIn = signIn;
      console.log('[DEV] __authSignIn listo en consola');
    }
    return () => { if (__DEV__) delete globalThis.__authSignIn; };
  }, [signIn]);
  // ── FIN DEV ───────────────────────────────────────────

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

  const validate = () => {
    const e = {};
    if (!email) e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo no válido';
    if (!password) e.password = 'La contraseña es requerida';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    if (Object.keys(e).length > 0) shake();
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      signIn(data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      setErrors({ general: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={s.title}>Bienvenido 👋</Text>
          <Text style={s.subtitle}>Inicia sesión en tu cuenta</Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={[s.input, errors.email && s.inputError]}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: null })); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={s.error}>{errors.email}</Text>}

            <Text style={s.label}>CONTRASEÑA</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.input, { flex: 1 }, errors.password && s.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <EyeIcon visible={showPass} size={W * 0.045} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.error}>{errors.password}</Text>}
            {errors.general && <Text style={s.error}>{errors.general}</Text>}
          </Animated.View>

          <TouchableOpacity style={s.forgotRow}>
            <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Iniciar sesión</Text>}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>o continúa con</Text>
            <View style={s.divider} />
          </View>

          <TouchableOpacity style={s.btnGoogle}>
            <GoogleIcon size={W * 0.05} />
            <Text style={s.btnGoogleText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.registerRow} onPress={() => navigation.navigate('Register')}>
            <Text style={s.registerText}>
              ¿Sin cuenta? <Text style={s.registerLink}>Regístrate gratis</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: W * 0.06, paddingTop: H * 0.07, paddingBottom: H * 0.04 },
  title: { fontSize: W * 0.07, fontWeight: '800', color: '#1A2035', marginBottom: H * 0.005 },
  subtitle: { fontSize: W * 0.035, color: '#888', marginBottom: H * 0.035 },
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
  forgotRow: { alignItems: 'flex-end', marginBottom: H * 0.025, marginTop: H * 0.01 },
  forgotText: { fontSize: W * 0.032, color: '#1A2035', fontWeight: '600' },
  btnPrimary: {
    backgroundColor: '#1A2035', paddingVertical: H * 0.018,
    borderRadius: W * 0.03, alignItems: 'center', marginBottom: H * 0.025,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#fff', fontSize: W * 0.04, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: H * 0.02 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: W * 0.03, color: '#aaa', marginHorizontal: W * 0.03 },
  btnGoogle: {
    borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: H * 0.016,
    borderRadius: W * 0.03, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: W * 0.025, marginBottom: H * 0.03,
  },
  btnGoogleText: { fontSize: W * 0.038, color: '#1A2035', fontWeight: '500' },
  registerRow: { alignItems: 'center' },
  registerText: { fontSize: W * 0.033, color: '#888' },
  registerLink: { color: '#1A2035', fontWeight: '800' },
});