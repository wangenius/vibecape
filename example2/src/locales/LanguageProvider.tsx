"use client";

import {
  createContext,
  useCallback,
  useContext, useMemo,
  useState,
  type ReactNode
} from "react";
import {
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/locales/dictionaries";

const LANGUAGE_STORAGE_KEY = "preferred-language";

interface LanguageContextValue {
  language: Locale;
  setLanguage: (next: Locale) => void;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>("en");

  const setLanguage = useCallback((next: Locale) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dictionary: dictionaries[language],
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * 
 * @returns 使用 LanguageProvider 包裹的组件中，可以使用这个 hook 来获取当前语言状态
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
