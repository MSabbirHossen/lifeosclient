import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user immediately from localStorage to eliminate flicker and unwanted redirect on refresh
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('lifeos_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Only show full loading spinner if token exists but cached user object has not been loaded yet
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('lifeos_token');
    const cachedUser = localStorage.getItem('lifeos_user');
    return Boolean(token && !cachedUser);
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('lifeos_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
        localStorage.setItem('lifeos_user', JSON.stringify(res.data));
      } catch (err) {
        console.warn('Profile fetch validation notice:', err.message);
        // Only clear credentials if the backend explicitly declares the token invalid/expired (401/403)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('lifeos_token');
          localStorage.removeItem('lifeos_user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('lifeos_token', token);
    localStorage.setItem('lifeos_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('lifeos_token', token);
    localStorage.setItem('lifeos_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const loginWithGoogle = async (credentialOrParams, testUser = null) => {
    let payload = {};
    if (typeof credentialOrParams === 'object' && credentialOrParams !== null) {
      payload = credentialOrParams;
    } else {
      payload = { credential: credentialOrParams, testUser };
    }
    const res = await api.post('/auth/google', payload);
    const { token, ...userData } = res.data;
    localStorage.setItem('lifeos_token', token);
    localStorage.setItem('lifeos_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    const res = await api.put('/auth/profile', updatedData);
    setUser(res.data);
    localStorage.setItem('lifeos_user', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
