import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('app_junction_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('app_junction_token');
      localStorage.removeItem('app_junction_admin');
    }
    return Promise.reject(error);
  }
);

export default api;
