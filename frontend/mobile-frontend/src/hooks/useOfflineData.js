// src/hooks/useOfflineData.js
// Hook que carga datos de la API y los guarda en AsyncStorage como cache.
// Si no hay conexión, sirve el cache. Al volver la conexión, refresca.
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api, { offlineQueue } from '../services/api';

/**
 * @param {string} endpoint  - ej. '/tasks'
 * @param {string} cacheKey  - ej. 'tf_cache_tasks'
 * @param {any}    fallback  - valor mientras carga (ej. [])
 */
export default function useOfflineData(endpoint, cacheKey, fallback = []) {
  const [data,    setData]    = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error,   setError]   = useState(null);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) setData(JSON.parse(cached));
    } catch {}
  }, [cacheKey]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.get(endpoint);
      setData(result);
      setOffline(false);
      // Guardar en cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      if (e.message === 'Network Error' || e.code === 'ECONNABORTED') {
        setOffline(true);
        await loadFromCache();
      } else {
        setError(e.response?.data?.error || 'Error al cargar datos');
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheKey, loadFromCache]);

  // Carga inicial
  useEffect(() => { fetchData(); }, [fetchData]);

  // Refrescar al volver conexión
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && offline) {
        fetchData(true);
        offlineQueue.flush().catch(()=>{});
      }
    });
    return unsub;
  }, [offline, fetchData]);

  return { data, loading, offline, error, refetch: () => fetchData() };
}
