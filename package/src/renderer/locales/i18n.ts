import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getCurrentSettings, updateSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";

// English translations
import enCommon from "./en/common.json";
import enHome from "./en/home.json";
import enAuth from "./en/auth.json";
import enDashboard from "./en/dashboard.json";

// Chinese translations
import zhCommon from "./zh-CN/common.json";
import zhHome from "./zh-CN/home.json";
import zhAuth from "./zh-CN/auth.json";
import zhDashboard from "./zh-CN/dashboard.json";

const resources = {
  "zh-CN": {
    translation: {
      common: zhCommon,
      home: zhHome,
      auth: zhAuth,
      dashboard: zhDashboard,
    },
  },
  "en-US": {
    translation: {
      common: enCommon,
      home: enHome,
      auth: enAuth,
      dashboard: enDashboard,
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en-US",
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
