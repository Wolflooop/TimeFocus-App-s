import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

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

export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

export const getToken = async () => AsyncStorage.getItem('token');

export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};