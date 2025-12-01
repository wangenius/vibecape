import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, jsonb, timestamp } from "./custom.type";

// ==================== Models ====================

export const models = sqliteTable("models", {
  id: id("id", { length: 24 }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  model: text("model").notNull(),
  base_url: text("base_url").notNull(),
  api_key: text("api_key").notNull(),
  type: text("type").notNull().default("text"),
  json: integer("json", { mode: "boolean" }).notNull().default(false),
  reasoner: integer("reasoner", { mode: "boolean" }).notNull().default(false),
});

export type Model = typeof models.$inferSelect;
export type ModelInsert = typeof models.$inferInsert;

// writing styles
export const writingStyle = sqliteTable("writing_styles", {
  id: id("id", { length: 24 }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  example: text("example"),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

export type WritingStyle = typeof writingStyle.$inferSelect;
export type WritingStyleInsert = typeof writingStyle.$inferInsert;

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
      novel: {
        autoInfer: true,
        enableContext: true,
        selectedNovelStyleId: "",
      },
      ui: {
        theme: "default",
        mode: "light",
        language: "zh-CN",
        showChapterList: true,
      },
      general: {
        proxy: {
          enabled: false,
          url: "",
        },
      },
    }),
});

export type SettingsData = {
  ui: {
    theme: string;
    mode: string;
    language: string;
    showChapterList: boolean;
  };
  model: {
    primary: string;
    fast: string;
    image: string;
    video: string;
    voice: string;
  };
  novel: {
    autoInfer: boolean;
    enableContext: boolean;
    selectedNovelStyleId: string;
  };
  general: {
    proxy: {
      enabled: boolean;
      url: string;
    };
  };
};

export type Setting = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;
