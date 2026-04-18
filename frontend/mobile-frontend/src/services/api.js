import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.106:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

// ── Token cache en memoria ────────────────────────────────────────
// Evita leer AsyncStorage en cada request (I/O async innecesario).
// Se carga una vez y se invalida en logout / 401.
let _cachedToken = null;

export const setAuthToken  = (token) => { _cachedToken = token; };
export const clearAuthToken = ()     => { _cachedToken = null;  };

// Pre-carga el token al iniciar la app para que el primer request
// no tenga que esperar AsyncStorage.
AsyncStorage.getItem('token').then(t => { if (t) _cachedToken = t; });

api.interceptors.request.use(async (config) => {
  // Solo va a AsyncStorage si aún no tenemos el token en memoria
  if (!_cachedToken) {
    _cachedToken = await AsyncStorage.getItem('token');
  }
  if (!_cachedToken && __DEV__) _cachedToken = globalThis.__tok;
  if (_cachedToken) config.headers.Authorization = `Bearer ${_cachedToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      _cachedToken = null; // invalida cache
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
