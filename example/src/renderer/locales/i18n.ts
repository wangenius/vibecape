import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "./en-US.json";
import zhCN from "./zh-CN.json";
import { getCurrentSettings, updateSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";

const resources = {
  "zh-CN": {
    translation: zhCN,
  },
  "en-US": {
    translation: enUS,
  },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "zh-CN",
  lng: getCurrentSettings().ui.language,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
  returnEmptyString: false,
  returnObjects: true,
  saveMissing: true,
  missingKeyHandler: (lng, _ns, key) => {
    console.warn(`Missing translation key: ${key} for language: ${lng}`);
  },
});

// 简单的翻译函数
export const lang = (key: string, options?: any): string => {
  return i18n.t(key, options) as string;
};

// 语言切换函数
export const setLang = (language: keyof typeof resources) => {
  void updateSettings(settingsShape.ui.language, language);
  i18n.changeLanguage(language);
};

export default i18n;
