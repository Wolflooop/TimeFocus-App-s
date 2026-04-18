import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.106:3000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const register = async (form) => {
  const { data } = await api.post('/auth/register', form);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const getStats = async () => {
  const { data } = await api.get('/sessions/stats');
  return data;
};

export const getTasks = async () => {
  const { data } = await api.get('/tasks');
  return data;
};

export const createTask = async (task) => {
  const { data } = await api.post('/tasks', task);
  return data;
};

export default api;