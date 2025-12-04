/**
 * AI 配置数据库表定义
 * 位置: ~/vibecape/app.db
 * 仅包含 providers 和 models
 */

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id } from "./custom.type";

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
