import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
  const token = window.localStorage.getItem('hdc_pulse_token') || 'development-token';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
