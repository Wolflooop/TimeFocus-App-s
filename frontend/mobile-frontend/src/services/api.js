// src/services/api.js
// API con soporte offline: guarda requests fallidos en AsyncStorage
// y los reintenta cuando vuelve la conexión
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ── Cambia esta IP a la IP de tu PC en la red local ──────────────
// En Windows: ipconfig | busca "Dirección IPv4"
// En Mac/Linux: ifconfig | busca "inet"
export const API_IP   = '192.168.0.106';   // ← CAMBIA ESTO
export const API_PORT = '3000';
export const API_URL  = `http://${API_IP}:${API_PORT}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ── Token cache en memoria ────────────────────────────────────────
let _cachedToken = null;

export const setAuthToken   = (token) => { _cachedToken = token; };
export const clearAuthToken = ()      => { _cachedToken = null;  };

AsyncStorage.getItem('token').then(t => { if (t) _cachedToken = t; });

api.interceptors.request.use(async (config) => {
  if (!_cachedToken) _cachedToken = await AsyncStorage.getItem('token');
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

// ── Cola offline ──────────────────────────────────────────────────
const QUEUE_KEY = 'tf_offline_queue';

export const offlineQueue = {
  async add(method, url, data) {
    const queue = await this.get();
    queue.push({ method, url, data, ts: Date.now(), id: Math.random().toString(36).slice(2) });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[Offline] Guardado en cola:', method, url);
  },

  async get() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  async flush() {
    const queue = await this.get();
    if (!queue.length) return 0;

    const remaining = [];
    let synced = 0;

    for (const item of queue) {
      try {
        await api({ method: item.method, url: item.url, data: item.data });
        synced++;
      } catch {
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    if (synced > 0) console.log(`[Offline] Sincronizados ${synced} items`);
    return synced;
  },

  async count() {
    return (await this.get()).length;
  },
};

// ── Auto-sincronizar cuando vuelve la conexión ────────────────────
NetInfo.addEventListener(state => {
  if (state.isConnected) offlineQueue.flush().catch(() => {});
});

export default api;
