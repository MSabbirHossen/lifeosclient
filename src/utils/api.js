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

// Fast In-Memory & Session Storage Stale-While-Revalidate Cache
const memoryCache = new Map();
const CACHE_PREFIX = 'lifeos_cache_';

export const getLocalCache = (key) => {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch (e) {
    // sessionStorage unavailable or quota exceeded
  }
  return null;
};

export const setLocalCache = (key, data, ttlMs = 120000) => {
  const item = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  memoryCache.set(key, item);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    // Ignore quota errors
  }
};

export const clearApiCache = (filterPrefix = '') => {
  if (!filterPrefix) {
    memoryCache.clear();
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((k) => {
        if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  } else {
    for (const k of memoryCache.keys()) {
      if (k.includes(filterPrefix)) memoryCache.delete(k);
    }
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((k) => {
        if (k.startsWith(CACHE_PREFIX) && k.includes(filterPrefix)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }
};

// SWR (Stale-While-Revalidate) fetch helper: returns instant cache if available, then updates in background
api.getCached = async (url, config = {}) => {
  const ttl = config.ttl || 120000;
  const forceFresh = config.forceFresh || false;
  const cacheKey = url;

  const cached = getLocalCache(cacheKey);

  // If not forcing fresh and cache exists
  if (!forceFresh && cached) {
    const isStale = Date.now() > cached.expiresAt;
    // If fresh, return cached data directly
    if (!isStale) {
      return { data: cached.data, fromCache: true };
    }
  }

  // Fetch fresh data
  try {
    const res = await api.get(url, config);
    setLocalCache(cacheKey, res.data, ttl);
    return { data: res.data, fromCache: false };
  } catch (err) {
    // Fall back to cached copy if offline/network fails
    if (cached) {
      return { data: cached.data, fromCache: true, isFallback: true };
    }
    throw err;
  }
};

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

// Response Interceptor: Handle auth errors and auto-invalidate cache on mutations
api.interceptors.response.use(
  (response) => {
    // Auto invalidate relevant cache on modifying requests (POST, PUT, DELETE, PATCH)
    const method = response.config?.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      clearApiCache();
    }
    return response;
  },
  (error) => {
    // Only handle genuine 401 authentication rejections on protected routes
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = error.config?.url || '';
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/google');

      // Do not clear existing session if it was just a failed login attempt with wrong credentials
      if (!isAuthAttempt) {
        localStorage.removeItem('lifeos_token');
        localStorage.removeItem('lifeos_user');
        clearApiCache();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lifeos-session-expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
