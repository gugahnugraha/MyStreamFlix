import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, LanguageCode } from "../translations";

const LANG_KEY = "mystreamflix_app_lang";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  cycleLanguage: () => void;
  t: typeof translations.id;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "id",
  setLanguage: () => {},
  cycleLanguage: () => {},
  t: translations.id,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("id");

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === "id" || saved === "en" || saved === "es") {
          setLanguageState(saved as LanguageCode);
        }
      } catch {}
    };
    loadLang();
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
  };

  const cycleLanguage = () => {
    const nextLang: LanguageCode = language === "id" ? "en" : language === "en" ? "es" : "id";
    setLanguage(nextLang);
  };

  const t = translations[language] || translations.id;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, cycleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);