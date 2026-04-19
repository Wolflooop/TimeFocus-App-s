// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, clearAuthToken } from './api';

const saveSession = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  setAuthToken(token);
};

// ── Login con email y contraseña ─────────────────────────────────
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  await saveSession(data.token, data.user);
  return data;
};

// ── Registro ──────────────────────────────────────────────────────
export const register = async (form) => {
  const { data } = await api.post('/auth/register', form);
  await saveSession(data.token, data.user);
  return data;
};

// ── Google Sign-In ────────────────────────────────────────────────
// Llama esto pasando el idToken que devuelve @react-native-google-signin
export const loginWithGoogle = async (idToken) => {
  const { data } = await api.post('/auth/google', { idToken });
  await saveSession(data.token, data.user);
  return data;
};

// ── Recuperar contraseña – Paso 1: solicitar código ───────────────
export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

// ── Recuperar contraseña – Paso 2: verificar código ──────────────
export const verifyResetCode = async (email, code) => {
  const { data } = await api.post('/auth/verify-reset-code', { email, code });
  return data;
};

// ── Recuperar contraseña – Paso 3: cambiar contraseña ────────────
export const resetPassword = async (email, code, newPassword) => {
  const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
  return data;
};

// ── Logout ────────────────────────────────────────────────────────
export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  clearAuthToken();
};

// ── Helpers ───────────────────────────────────────────────────────
export const getToken = async () => AsyncStorage.getItem('token');
export const getUser  = async () => {
  const u = await AsyncStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const isAuthenticated = async () => !!(await AsyncStorage.getItem('token'));
