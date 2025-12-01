import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// 每日统计数据，用于热力图和图表
export const daily_stats = sqliteTable("daily_stats", {
  id: text("id").primaryKey(),
  cosmos_id: text("cosmos_id").notNull(), // 所属项目 ID
  date: text("date").notNull(), // YYYY-MM-DD
  
  cosmos_edits: integer("cosmos_edits").notNull().default(0), // 世界观编辑次数
  novel_edits: integer("novel_edits").notNull().default(0), // 小说编辑次数
  novel_word_count: integer("novel_word_count").notNull().default(0), // 当日字数变化
  
  created_at: integer("created_at", { mode: "timestamp" }),
  updated_at: integer("updated_at", { mode: "timestamp" }),
}, (table) => ({
  // 每个项目每天只有一条记录
  uniq_date_project: uniqueIndex("uniq_date_project").on(table.date, table.cosmos_id),
}));

// 详细修改记录
export const modification_logs = sqliteTable("modification_logs", {
  id: text("id").primaryKey(),
  cosmos_id: text("cosmos_id").notNull(), // 所属项目 ID
  entity_type: text("entity_type").notNull(), // 'actant', 'lore', 'story', 'novel', 'chapter'
  entity_id: text("entity_id").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  details: text("details"), // JSON string with details
  
  created_at: integer("created_at", { mode: "timestamp" }),
});

export type DailyStats = typeof daily_stats.$inferSelect;
export type DailyStatsInsert = typeof daily_stats.$inferInsert;
export type ModificationLog = typeof modification_logs.$inferSelect;
export type ModificationLogInsert = typeof modification_logs.$inferInsert;
