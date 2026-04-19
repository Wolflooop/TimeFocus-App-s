// src/screens/auth/LoginScreen.js
// – Login con email/contraseña
// – Botón Google Sign-In (@react-native-google-signin/google-signin)
// – Link "¿Olvidaste tu contraseña?" → ForgotPasswordScreen
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { login, loginWithGoogle } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import EyeIcon from '../../components/icons/EyeIcon';
import GoogleIcon from '../../components/icons/GoogleIcon';
import { font, space, radius, rv, rs } from '../../theme/responsive';

// Importar Google Sign-In si está instalado
let GoogleSignin = null;
let statusCodes  = null;
try {
  const pkg = require('@react-native-google-signin/google-signin');
  GoogleSignin = pkg.GoogleSignin;
  statusCodes  = pkg.statusCodes;
} catch (_) {}

const C = {
  navy:   colors.primary,
  accent: colors.accent,
  muted:  colors.textSecondary,
  bg:     '#fff',
  error:  colors.error,
};

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { signIn } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    // Configurar Google Sign-In
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com', // ← de Google Console
        offlineAccess: false,
      });
    }
    // DEV helper
    if (__DEV__) globalThis.__authSignIn = signIn;
    return () => { if (__DEV__) delete globalThis.__authSignIn; };
  }, [signIn]);

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue:10,  duration:60, useNativeDriver:true }),
    Animated.timing(shakeAnim, { toValue:-10, duration:60, useNativeDriver:true }),
    Animated.timing(shakeAnim, { toValue:10,  duration:60, useNativeDriver:true }),
    Animated.timing(shakeAnim, { toValue:0,   duration:60, useNativeDriver:true }),
  ]).start();

  const validate = () => {
    const e = {};
    if (!email)                     e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo no válido';
    if (!password)                  e.password = 'La contraseña es requerida';
    else if (password.length < 6)   e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    if (Object.keys(e).length) shake();
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      signIn(data.user);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Error al iniciar sesión. Verifica tu conexión.' });
      shake();
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Google Sign-In',
        'Instala @react-native-google-signin/google-signin y configura GOOGLE_CLIENT_ID en el backend.\n\nVer README.md para instrucciones.',
      );
      return;
    }
    setGLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      const data = await loginWithGoogle(idToken);
      signIn(data.user);
    } catch (err) {
      if (err.code === statusCodes?.SIGN_IN_CANCELLED) return;
      if (err.code === statusCodes?.IN_PROGRESS) return;
      setErrors({ general: err.response?.data?.error || 'Error con Google Sign-In' });
      shake();
    } finally { setGLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <ScrollView
        style={{ flex:1, backgroundColor:C.bg }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled">

        <Animated.View style={{ opacity:fadeAnim, transform:[{translateX:shakeAnim}] }}>
          <Text style={s.title}>Bienvenido 👋</Text>
          <Text style={s.subtitle}>Inicia sesión en tu cuenta</Text>

          {/* Email */}
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            style={[s.input, errors.email && s.inputError]}
            placeholder="ana.garcia@utxj.edu.mx"
            placeholderTextColor={C.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e=>({...e,email:undefined})); }}
            returnKeyType="next"
          />
          {!!errors.email && <Text style={s.errorTxt}>{errors.email}</Text>}

          {/* Password */}
          <Text style={[s.label,{marginTop:rv(14)}]}>Contraseña</Text>
          <View style={s.passWrap}>
            <TextInput
              style={[s.input, { paddingRight:48 }, errors.password && s.inputError]}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e=>({...e,password:undefined})); }}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
            <TouchableOpacity style={s.eye} onPress={()=>setShowPass(v=>!v)} activeOpacity={0.7}>
              <EyeIcon visible={showPass}/>
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={s.errorTxt}>{errors.password}</Text>}

          {/* Olvidé contraseña */}
          <TouchableOpacity
            style={s.forgotWrap}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}>
            <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Error general */}
          {!!errors.general && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxTxt}>⚠️ {errors.general}</Text>
            </View>
          )}

          {/* Login btn */}
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={s.btnTxt}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine}/>
            <Text style={s.divTxt}>o continúa con</Text>
            <View style={s.divLine}/>
          </View>

          {/* Google btn */}
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={gLoading} activeOpacity={0.85}>
            {gLoading
              ? <ActivityIndicator color={C.navy} size="small"/>
              : <>
                  <GoogleIcon/>
                  <Text style={s.googleTxt}>Continuar con Google</Text>
                </>
            }
          </TouchableOpacity>

          {/* Register link */}
          <View style={s.registerRow}>
            <Text style={s.registerTxt}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={[s.registerTxt, s.registerLink]}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content:      { flexGrow:1, paddingHorizontal:space.screen, paddingTop:rv(50), paddingBottom:rv(40) },
  title:        { fontSize:font.xxl, fontWeight:'900', color:colors.primary, marginBottom:rv(6) },
  subtitle:     { fontSize:font.md, color:colors.textSecondary, marginBottom:rv(28) },
  label:        { fontSize:font.sm, fontWeight:'600', color:colors.primary, marginBottom:rv(6) },
  input:        { borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md,
                  paddingHorizontal:rv(14), paddingVertical:rv(12),
                  fontSize:font.md, color:colors.primary, backgroundColor:'#F8FAFF' },
  inputError:   { borderColor:colors.error },
  passWrap:     { position:'relative' },
  eye:          { position:'absolute', right:14, top:'50%', transform:[{translateY:-12}] },
  errorTxt:     { color:colors.error, fontSize:font.xs, marginTop:4, fontWeight:'600' },
  forgotWrap:   { alignSelf:'flex-end', marginTop:rv(10) },
  forgotTxt:    { fontSize:font.sm, color:colors.primary, fontWeight:'600',
                  textDecorationLine:'underline' },
  errorBox:     { backgroundColor:'#FFF0F0', borderRadius:radius.md, padding:rv(12),
                  marginTop:rv(12) },
  errorBoxTxt:  { color:colors.error, fontSize:font.sm, fontWeight:'600' },
  btn:          { backgroundColor:colors.primary, borderRadius:radius.lg,
                  paddingVertical:rv(15), alignItems:'center', marginTop:rv(20) },
  btnTxt:       { color:'#fff', fontWeight:'800', fontSize:font.md },
  divider:      { flexDirection:'row', alignItems:'center', gap:10, marginVertical:rv(20) },
  divLine:      { flex:1, height:1, backgroundColor:colors.border },
  divTxt:       { fontSize:font.xs, color:colors.textSecondary, fontWeight:'600' },
  googleBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10,
                  borderWidth:1.5, borderColor:colors.border, borderRadius:radius.lg,
                  paddingVertical:rv(13), backgroundColor:'#fff' },
  googleTxt:    { fontSize:font.md, fontWeight:'700', color:colors.primary },
  registerRow:  { flexDirection:'row', justifyContent:'center', marginTop:rv(24) },
  registerTxt:  { fontSize:font.sm, color:colors.textSecondary },
  registerLink: { color:colors.primary, fontWeight:'700', textDecorationLine:'underline' },
});
