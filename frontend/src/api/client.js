import axios from 'axios';
import { getStoredValue, LEGACY_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = getStoredValue(TOKEN_STORAGE_KEY, LEGACY_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
