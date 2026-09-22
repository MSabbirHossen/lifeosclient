import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations, getTranslation, SUPPORTED_LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_language');
      if (saved && ['en', 'bn', 'ar'].includes(saved)) {
        return saved;
      }
      // Check browser navigator language
      const browserLang = navigator.language?.slice(0, 2);
      if (browserLang === 'bn') return 'bn';
      if (browserLang === 'ar') return 'ar';
    } catch (e) {
      console.error('Failed reading saved language', e);
    }
    return 'en';
  });

  const currentLangObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const direction = currentLangObj.dir || 'ltr';

  // Apply direction and lang attributes to documentElement
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    
    // Set appropriate font class for the language
    if (language === 'bn') {
      document.body.classList.add('font-bengali');
      document.body.classList.remove('font-arabic');
    } else if (language === 'ar') {
      document.body.classList.add('font-arabic');
      document.body.classList.remove('font-bengali');
    } else {
      document.body.classList.remove('font-bengali', 'font-arabic');
    }

    try {
      localStorage.setItem('lifeos_language', language);
    } catch (e) {
      console.error('Failed saving language', e);
    }
  }, [language, direction]);

  const setLanguage = useCallback((newLang) => {
    if (['en', 'bn', 'ar'].includes(newLang)) {
      setLanguageState(newLang);
    }
  }, []);

  const t = useCallback(
    (key, fallback = '') => {
      return getTranslation(language, key, fallback);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      changeLanguage: setLanguage,
      direction,
      isRTL: direction === 'rtl',
      currentLangObj,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
    }),
    [language, direction, currentLangObj, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
