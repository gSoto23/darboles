"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';
import esDict from '@/locales/es.json';
import enDict from '@/locales/en.json';

interface TranslationContextType {
  locale: string;
  setLocale: (lang: string) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  initialLocale: string;
}

export function TranslationProvider({ children, initialLocale }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState(initialLocale);

  const dictionary: Record<string, string> = locale === 'en' ? enDict : esDict;

  const setLocale = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/`;
    setLocaleState(lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    let str = dictionary[key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return str;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context;
}
