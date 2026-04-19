// src/screens/auth/ForgotPasswordScreen.js
// Flujo de 3 pasos:
//   1. Ingresa tu correo → se envía código
//   2. Ingresa el código de 6 dígitos
//   3. Escribe la nueva contraseña
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors }  from '../../theme/colors';
import { font, space, radius, rv, rs } from '../../theme/responsive';
import { forgotPassword, verifyResetCode, resetPassword } from '../../services/authService';

const C = {
  navy:   colors.primary,
  accent: colors.accent,
  muted:  colors.textSecondary,
  bg:     colors.background,
  card:   '#fff',
  error:  colors.error,
  success:colors.success,
};

const STEPS = ['correo', 'codigo', 'nueva'];

export default function ForgotPasswordScreen({ navigation }) {
  const [step,        setStep]        = useState(0);  // 0,1,2
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState(['','','','','','']);
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const codeRefs = useRef([...Array(6)].map(() => React.createRef()));
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, [step]);

  const shake = () => {
    fadeAnim.setValue(1);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:10, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:-10,duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:10, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:0,  duration:60, useNativeDriver:true }),
    ]).start();
  };

  const showError = (msg) => { setError(msg); shake(); };

  // ── Step 0: pedir correo ──────────────────────────────────────
  const handleSendCode = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showError('Ingresa un correo válido'); return;
    }
    setLoading(true); setError('');
    try {
      await forgotPassword(email.toLowerCase().trim());
      setStep(1);
      setTimeout(() => codeRefs.current[0]?.current?.focus(), 300);
    } catch (e) {
      showError(e.response?.data?.error || 'Error al enviar el código');
    } finally { setLoading(false); }
  };

  // ── Step 1: verificar código ──────────────────────────────────
  const handleCodeChange = (val, idx) => {
    const digits = [...code];
    digits[idx] = val.replace(/\D/g, '');
    setCode(digits);
    if (val && idx < 5) codeRefs.current[idx + 1]?.current?.focus();
    if (!val && idx > 0) codeRefs.current[idx - 1]?.current?.focus();
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) { showError('Ingresa los 6 dígitos'); return; }
    setLoading(true); setError('');
    try {
      await verifyResetCode(email, fullCode);
      setStep(2);
    } catch (e) {
      showError(e.response?.data?.error || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  // ── Step 2: nueva contraseña ──────────────────────────────────
  const handleResetPassword = async () => {
    if (newPass.length < 6) { showError('Mínimo 6 caracteres'); return; }
    if (newPass !== confirmPass) { showError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(email, code.join(''), newPass);
      setSuccess('¡Contraseña actualizada! Ahora puedes iniciar sesión.');
      setTimeout(() => navigation.navigate('Login'), 2500);
    } catch (e) {
      showError(e.response?.data?.error || 'Error al actualizar la contraseña');
    } finally { setLoading(false); }
  };

  // ── Progress indicator ────────────────────────────────────────
  const Progress = () => (
    <View style={pr.wrap}>
      {STEPS.map((_, i) => (
        <View key={i} style={[pr.dot, i <= step && pr.active, i < step && pr.done]}/>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <ScrollView
        style={{ flex:1, backgroundColor:C.bg }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => step > 0 ? setStep(s=>s-1) : navigation.goBack()} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={s.backTxt}>Volver</Text>
        </TouchableOpacity>

        <Animated.View style={{ opacity:fadeAnim, transform:[{translateX:shakeAnim}] }}>
          <Text style={s.icon}>
            {step === 0 ? '📧' : step === 1 ? '🔐' : '🔒'}
          </Text>
          <Text style={s.title}>
            {step === 0 ? 'Recuperar contraseña' : step === 1 ? 'Ingresa el código' : 'Nueva contraseña'}
          </Text>
          <Text style={s.subtitle}>
            {step === 0
              ? 'Te enviaremos un código de 6 dígitos a tu correo.'
              : step === 1
              ? `Revisa tu correo ${email}. El código expira en 10 min.`
              : 'Crea una contraseña segura de al menos 6 caracteres.'}
          </Text>
        </Animated.View>

        <Progress/>

        {/* ── Paso 0: correo ─── */}
        {step === 0 && (
          <View style={s.form}>
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              placeholder="ana.garcia@utxj.edu.mx"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleSendCode}
              returnKeyType="send"
            />
            {!!error && <Text style={s.error}>{error}</Text>}
            <TouchableOpacity style={s.btn} onPress={handleSendCode} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnTxt}>Enviar código</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Paso 1: código ─── */}
        {step === 1 && (
          <View style={s.form}>
            <View style={code_s.row}>
              {code.map((d, i) => (
                <TextInput
                  key={i}
                  ref={codeRefs.current[i]}
                  style={[code_s.box, d && code_s.boxFilled]}
                  value={d}
                  onChangeText={v => handleCodeChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>
            {!!error && <Text style={[s.error, {textAlign:'center'}]}>{error}</Text>}

            <TouchableOpacity style={s.btn} onPress={handleVerifyCode} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnTxt}>Verificar código</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.link} onPress={() => { setCode(['','','','','','']); handleSendCode(); }} activeOpacity={0.7}>
              <Text style={s.linkTxt}>¿No recibiste el código? Reenviar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Paso 2: nueva contraseña ─── */}
        {step === 2 && (
          <View style={s.form}>
            {!!success
              ? <View style={s.successBox}>
                  <Text style={s.successTxt}>✅ {success}</Text>
                </View>
              : <>
                  <Text style={s.label}>Nueva contraseña</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={[s.input, {paddingRight:48}]}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={C.muted}
                      secureTextEntry={!showPass}
                      value={newPass}
                      onChangeText={setNewPass}
                    />
                    <TouchableOpacity style={s.eye} onPress={()=>setShowPass(v=>!v)}>
                      <Text style={{fontSize:18}}>{showPass?'🙈':'👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[s.label,{marginTop:16}]}>Confirmar contraseña</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={C.muted}
                    secureTextEntry={!showPass}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    onSubmitEditing={handleResetPassword}
                    returnKeyType="done"
                  />
                  {!!error && <Text style={s.error}>{error}</Text>}

                  <TouchableOpacity style={s.btn} onPress={handleResetPassword} disabled={loading} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnTxt}>Actualizar contraseña</Text>}
                  </TouchableOpacity>
                </>
            }
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content:    { flexGrow:1, paddingHorizontal:space.screen, paddingTop:rv(20), paddingBottom:rv(40), backgroundColor:C.bg },
  back:       { flexDirection:'row', alignItems:'center', gap:6, marginBottom:rv(28) },
  backTxt:    { fontSize:font.md, fontWeight:'600', color:C.navy },
  icon:       { fontSize:rs(44), textAlign:'center', marginBottom:rv(12) },
  title:      { fontSize:font.xl, fontWeight:'800', color:C.navy, textAlign:'center', marginBottom:rv(8) },
  subtitle:   { fontSize:font.sm, color:C.muted, textAlign:'center', lineHeight:rs(20), marginBottom:rv(24) },
  form:       { backgroundColor:C.card, borderRadius:radius.xl, padding:rv(20),
                shadowColor:'#000', shadowOpacity:0.06, shadowRadius:12,
                shadowOffset:{width:0,height:4}, elevation:4 },
  label:      { fontSize:font.sm, fontWeight:'600', color:C.navy, marginBottom:rv(6) },
  input:      { borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md,
                paddingHorizontal:rv(14), paddingVertical:rv(12),
                fontSize:font.md, color:C.navy, backgroundColor:'#F8FAFF' },
  inputWrap:  { position:'relative' },
  eye:        { position:'absolute', right:14, top:'50%', transform:[{translateY:-14}] },
  btn:        { backgroundColor:C.navy, borderRadius:radius.lg, paddingVertical:rv(14),
                alignItems:'center', marginTop:rv(20) },
  btnTxt:     { color:'#fff', fontWeight:'800', fontSize:font.md },
  error:      { color:C.error, fontSize:font.xs, marginTop:rv(8), fontWeight:'600' },
  link:       { alignItems:'center', marginTop:rv(14) },
  linkTxt:    { fontSize:font.sm, color:C.navy, fontWeight:'600', textDecorationLine:'underline' },
  successBox: { backgroundColor:'#E8F5E9', borderRadius:radius.md, padding:rv(16) },
  successTxt: { color:'#2E7D32', fontWeight:'700', fontSize:font.md, textAlign:'center' },
});

const pr = StyleSheet.create({
  wrap:   { flexDirection:'row', justifyContent:'center', gap:8, marginBottom:rv(24) },
  dot:    { width:10, height:10, borderRadius:5, backgroundColor:colors.border },
  active: { backgroundColor:C.navy, width:24 },
  done:   { backgroundColor:C.success, width:10 },
});

const code_s = StyleSheet.create({
  row:      { flexDirection:'row', gap:8, justifyContent:'center', marginBottom:rv(20) },
  box:      { width:44, height:54, borderWidth:2, borderColor:colors.border,
              borderRadius:radius.md, fontSize:rs(24), fontWeight:'800',
              color:C.navy, backgroundColor:'#F8FAFF', textAlign:'center' },
  boxFilled:{ borderColor:C.navy, backgroundColor:'#EEF2FF' },
});
