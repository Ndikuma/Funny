import React, { createContext, useContext, useEffect, useState } from 'react';
import { en, type TranslationKeys } from '../i18n/en';
import { fr } from '../i18n/fr';
import { rn } from '../i18n/rn';
import type { Language } from '../types/vibebattle';

const DICTIONARIES: Record<Language, TranslationKeys> = { en, fr, rn };
const LANG_STORAGE_KEY = 'vibebattle_lang';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (saved === 'en' || saved === 'fr' || saved === 'rn') return saved;
    } catch {
      // Ignore storage error
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage error
    }
  };

  useEffect(() => {
    document.documentElement.lang = language === 'rn' ? 'rn' : language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: DICTIONARIES[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
