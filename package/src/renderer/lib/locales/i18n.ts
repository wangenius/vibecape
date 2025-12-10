import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { updateSettings, useSettingsStore } from "@/hooks/app/useSettings";
import { createShape } from "@common/lib/shape";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";

const appConfigShape = createShape(DEFAULT_APP_CONFIG);

// English translations
import enCommon from "./en/common.json";
import enChat from "./en/chat.json";
import enSettings from "./en/settings.json";
import enEditor from "./en/editor.json";

// Chinese translations
import zhCommon from "./zh/common.json";
import zhChat from "./zh/chat.json";
import zhSettings from "./zh/settings.json";
import zhEditor from "./zh/editor.json";

const resources = {
  "zh": {
    translation: {
      common: {
        ...zhCommon,
        settings: zhSettings,
        ...zhEditor,
      },
      chat: zhChat,
      ...zhCommon,
      settings: zhSettings,
      ...zhEditor,
    },
  },
  "en": {
    translation: {
      common: {
        ...enCommon,
        settings: enSettings,
        ...enEditor,
      },
      chat: enChat,
      ...enCommon,
      settings: enSettings,
      ...enEditor,
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  lng: DEFAULT_APP_CONFIG.ui.language,
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
  void updateSettings(appConfigShape.ui.language, language);
  i18n.changeLanguage(language);
};

// 同步语言设置
export function syncLanguageFromSettings(language: string) {
  if (language && language !== i18n.language) {
    i18n.changeLanguage(language);
  }
}

// 订阅 settings 变化，自动同步语言
useSettingsStore.subscribe((state) => {
  syncLanguageFromSettings(state.ui.language);
});

export default i18n;
