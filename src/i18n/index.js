import { en } from './en';
import { bn } from './bn';
import { ar } from './ar';

export const translations = {
  en,
  bn,
  ar,
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'bn', label: 'Bangla', nativeName: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

/**
 * Resolves a nested key (e.g. 'fitness.measurements') from the translation dictionary.
 */
export function getTranslation(lang, key, fallback = '') {
  const currentDict = translations[lang] || translations.en;
  const keys = key.split('.');
  
  let result = currentDict;
  for (const k of keys) {
    if (result && Object.prototype.hasOwnProperty.call(result, k)) {
      result = result[k];
    } else {
      result = undefined;
      break;
    }
  }

  if (result !== undefined && typeof result === 'string') {
    return result;
  }

  // Fallback to English if translation is missing in current language
  if (lang !== 'en') {
    let fallbackResult = translations.en;
    for (const k of keys) {
      if (fallbackResult && Object.prototype.hasOwnProperty.call(fallbackResult, k)) {
        fallbackResult = fallbackResult[k];
      } else {
        fallbackResult = undefined;
        break;
      }
    }
    if (fallbackResult !== undefined && typeof fallbackResult === 'string') {
      return fallbackResult;
    }
  }

  return fallback || key;
}
