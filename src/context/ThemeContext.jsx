import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lifeos_theme') || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t) => {
      let resolvedTheme = t;
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      setEffectiveTheme(resolvedTheme);
      root.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme(theme);
    localStorage.setItem('lifeos_theme', theme);

    // Listen for system theme changes if theme is set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
