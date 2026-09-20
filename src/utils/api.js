import axios from 'axios';

// Determine base API URL: prioritizes VITE_API_URL, falls back to relative /api proxy
const baseURL = import.meta.env.VITE_API_URL || '/api';

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
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/google');

      // Do not clear existing session if it was just a failed login attempt with wrong credentials
      if (!isAuthAttempt) {
        const msg = (error.response.data?.message || '').toLowerCase();
        // Clear full session only if backend confirms token invalidity or user removed
        if (msg.includes('token') || msg.includes('user no longer exists') || msg.includes('not authorized')) {
          localStorage.removeItem('lifeos_token');
          localStorage.removeItem('lifeos_user');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lifeos-session-expired'));
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
