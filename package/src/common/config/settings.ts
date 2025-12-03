import type { SettingsData } from "@common/schema/app";
import { createShape } from "@common/lib/shape";

export const SETTINGS_DEFAULTS: SettingsData = {
  ui: {
    theme: "default",
    mode: "light",
    language: "en-US",
    promptLanguage: "en-US",
    showChapterList: true,
  },
  model: {
    primary: "",
    fast: "",
    image: "",
    video: "",
    voice: "",
  },
  general: {
    proxy: {
      enabled: false,
      url: "",
    },
    oss: {
      enabled: false,
      provider: "aliyun",
      region: "",
      bucket: "",
      accessKeyId: "",
      accessKeySecret: "",
      endpoint: "",
      customDomain: "",
    },
    docsRoot: "",
    vibecapeRoot: "",
  },
};

export const settingsShape = createShape<SettingsData>(
  SETTINGS_DEFAULTS as SettingsData
);

// Deprecated helpers intentionally removed to favor direct shape path usage
