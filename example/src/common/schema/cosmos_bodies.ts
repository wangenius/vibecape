import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { id, jsonb, timestamp } from "./custom.type";
import { JSONContent } from "@tiptap/core";

// ==================== 角色相关 ====================

// 角色类型表
export const actantTypes = sqliteTable("actant_types", {
  id: id("id"),
  name: text("name").notNull(),
});

// 角色表
export const actants = sqliteTable("actants", {
  id: id("id"),
  type_id: text("type_id"),
  name: text("name").notNull().default(""),
  description: jsonb<JSONContent>()("description")
    .notNull()
    .$defaultFn(() => ({
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    })),
  avatar: text("avatar").notNull().default(""),
  main_char: integer("main_char", { mode: "boolean" }).notNull().default(false),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// 角色状态表
export const actantStates = sqliteTable(
  "actant_states",
  {
    id: id("id"),
    actant_id: text("actant_id")
      .notNull()
      .references(() => actants.id, {
        onDelete: "cascade",
      }),
    story_id: text("story_id").notNull().default("default"),
    name: text("name").notNull().default(""),
    body: jsonb<JSONContent>()("body")
      .notNull()
      .$defaultFn(() => ({
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      })),
  },
  (table) => [
    // 添加唯一约束：同一个角色在同一个剧情中只能有一个状态
    unique().on(table.actant_id, table.story_id),
  ]
);

// 关系表
export const actantRelations = sqliteTable("relations", {
  id: id("id"),
  actant_a: text("actant_a")
    .notNull()
    .references(() => actants.id, { onDelete: "cascade" }),
  actant_b: text("actant_b")
    .notNull()
    .references(() => actants.id, { onDelete: "cascade" }),
  story_id: text("story_id").notNull(),
  a_to_b: text("a_to_b").notNull().default(""),
  b_to_a: text("b_to_a").notNull().default(""),
});

// ==================== 剧情 ====================

export const stories = sqliteTable("stories", {
  id: id("id"),
  parent_id: text("parent_id").notNull().default(""),
  order_index: integer("order_index", { mode: "number" }).notNull().default(0),
  name: text("name").notNull().default(""),
  cover: text("cover").notNull().default(""),
  body: jsonb<JSONContent>()("body")
    .notNull()
    .$defaultFn(() => ({
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    })),
  position_x: real("position_x").notNull().default(0),
  position_y: real("position_y").notNull().default(0),
  last_ids: jsonb<string[]>()("last_ids").notNull().default([]), // JSON: string[]
  next_ids: jsonb<string[]>()("next_ids").notNull().default([]), // JSON: string[]
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// ==================== 设定 ====================

// 设定类型表
export const loreTypes = sqliteTable("lore_types", {
  id: id("id"),
  name: text("name").notNull().default(""),
});

// 设定表
export const lores = sqliteTable("lores", {
  id: id("id"),
  parent_id: text("parent_id").notNull().default(""),
  type_id: text("type_id").notNull().default(""),
  name: text("name").notNull().default(""),
  description: text("description").notNull().default(""),
  multiple: integer("multiple", { mode: "boolean" }).notNull().default(false),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// ==================== 作品 ====================

// ==================== Types ====================

export type ActantType = typeof actantTypes.$inferSelect;
export type ActantTypeInsert = typeof actantTypes.$inferInsert;
export type Actant = typeof actants.$inferSelect;
export type ActantInsert = typeof actants.$inferInsert;
export type ActantState = typeof actantStates.$inferSelect;
export type ActantStateInsert = typeof actantStates.$inferInsert;
export type ActantRelation = typeof actantRelations.$inferSelect;
export type ActantRelationInsert = typeof actantRelations.$inferInsert;
export type LoreType = typeof loreTypes.$inferSelect;
export type LoreTypeInsert = typeof loreTypes.$inferInsert;
export type Lore = typeof lores.$inferSelect;
export type LoreInsert = typeof lores.$inferInsert;
export type Story = typeof stories.$inferSelect;
export type StoryInsert = typeof stories.$inferInsert;
