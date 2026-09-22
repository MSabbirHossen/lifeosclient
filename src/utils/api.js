import axios from 'axios';

// Determine base API URL: In local development, always route through local Vite proxy (/api -> localhost:5000)
// In production builds, use VITE_API_URL (e.g. deployed serverless/backend)
const baseURL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lifeos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle genuine 401 authentication rejections on protected routes
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = error.config?.url || '';
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/google');

      // Do not clear existing session if it was just a failed login attempt with wrong credentials
      if (!isAuthAttempt) {
        localStorage.removeItem('lifeos_token');
        localStorage.removeItem('lifeos_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lifeos-session-expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
