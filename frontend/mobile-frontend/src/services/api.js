import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

const api = axios.create({
  baseURL: env.API_URL,
  timeout: 8000,
});

// Token cache en memoria para evitar leer AsyncStorage en cada request
let _cachedToken = null;

export const setAuthToken  = (token) => { _cachedToken = token; };
export const clearAuthToken = ()     => { _cachedToken = null;  };

// Pre-carga el token al iniciar la app
AsyncStorage.getItem('token').then(t => { if (t) _cachedToken = t; });

api.interceptors.request.use(async (config) => {
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
      _cachedToken = null;
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
