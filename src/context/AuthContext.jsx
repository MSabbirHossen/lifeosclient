import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Failed to load user profile', err);
        localStorage.removeItem('lifeos_token');
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
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('lifeos_token', token);
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
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('lifeos_token');
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    const res = await api.put('/auth/profile', updatedData);
    setUser(res.data);
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
