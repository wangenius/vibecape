import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, jsonb } from "./custom.type";

// ==================== Providers ====================

export const providers = sqliteTable("providers", {
  id: id("id", { length: 24 }),
  name: text("name").notNull(),
  base_url: text("base_url").notNull(),
  api_key: text("api_key").notNull(),
  models_path: text("models_path").notNull().default("/models"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export type Provider = typeof providers.$inferSelect;
export type ProviderInsert = typeof providers.$inferInsert;

// ==================== Models ====================

export const models = sqliteTable("models", {
  id: id("id", { length: 24 }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  model: text("model").notNull(),
  provider_id: text("provider_id").notNull().default(""),
  type: text("type").notNull().default("text"),
  json: integer("json", { mode: "boolean" }).notNull().default(false),
  reasoner: integer("reasoner", { mode: "boolean" }).notNull().default(false),
});

export type Model = typeof models.$inferSelect;
export type ModelInsert = typeof models.$inferInsert;

// writing styles
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb<SettingsData>()("value")
    .notNull()
    .default({
      model: {
        primary: "",
        fast: "",
        image: "",
        video: "",
        voice: "",
      },
      ui: {
        theme: "default",
        mode: "light",
        language: "zh-CN",
        promptLanguage: "zh-CN",
        showChapterList: true,
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
    }),
});

export type SettingsData = {
  ui: {
    theme: string;
    mode: string;
    language: string;
    promptLanguage: string;
    showChapterList: boolean;
  };
  model: {
    primary: string;
    fast: string;
    image: string;
    video: string;
    voice: string;
  };
  general: {
    proxy: {
      enabled: boolean;
      url: string;
    };
    oss: {
      enabled: boolean;
      provider: "aliyun" | "qiniu" | "tencent" | "s3";
      region: string;
      bucket: string;
      accessKeyId: string;
      accessKeySecret: string;
      endpoint: string;
      customDomain: string;
    };
    docsRoot: string;
    vibecapeRoot: string;
  };
};

export type Setting = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;
