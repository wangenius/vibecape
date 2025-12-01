import { PluginMainContext } from "@common/types/plugin";
import { daily_stats, modification_logs } from "../schema";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { desc, eq, and, gte, sql } from "drizzle-orm";
import { cosmosManager } from "@main/utils/CosmosManager";
import { ensureSchema } from "@main/db/ensure-schema";
import { gen } from "@common/lib/generator";
import { eventBus, DbChangeEvent } from "@main/services/EventBus";
import { getCosmosDb } from "@main/db/cosmos";
import { chapters } from "@common/schema/novel";

let db: LibSQLDatabase<{ daily_stats: typeof daily_stats; modification_logs: typeof modification_logs }> | null = null;
const debounceTimers = new Map<string, NodeJS.Timeout>();

export async function onMainLoad(ctx: PluginMainContext) {
  // 1. 获取 DB
  const dbPath = ctx.getDbPath(); 
  const client = createClient({ url: `file:${dbPath}` });
  // Include schema in drizzle init for query type safety
  db = drizzle(client, { schema: { daily_stats, modification_logs } });

  // Initialize Schema (Create tables if not exist)
  try {
      await ensureSchema(client, db, { daily_stats, modification_logs });
      console.log("[StatsPlugin] Database initialized");
  } catch (e) {
      console.error("[StatsPlugin] Database init failed", e);
  }

  // 2. 注册 IPC
  ctx.ipcHandle("get-daily", async (_: any, days = 365) => {
    try {
        const cosmosId = cosmosManager.getCurrentCosmosId();
        if (!cosmosId) return [];

        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0];

        if (!db) return [];

        return await db.select()
            .from(daily_stats)
            .where(
                and(
                    eq(daily_stats.cosmos_id, cosmosId),
                    gte(daily_stats.date, dateStr)
                )
            )
            .orderBy(desc(daily_stats.date));
    } catch (error) {
        console.error("[StatsPlugin] Failed to get stats:", error);
        return [];
    }
  });

  // 3. 订阅事件
  eventBus.on("db:change", handleDbChange);
  
  console.log("[StatsPlugin] Main process loaded");
}

/**
 * 处理数据库变动事件
 */
const handleDbChange = async (event: DbChangeEvent) => {
  if (!db) return;
  const { cosmosId, tableName } = event;
  const today = new Date().toISOString().split('T')[0];
  
  let type = 'cosmos';
  if (tableName === 'chapters' || tableName === 'novels') {
    type = 'novel';
  }

  // 1. 更新“编辑次数” (Edits)
  await updateEditsCount(cosmosId, type, 1, today);

  // 2. 如果是小说变动，重新计算“当日总字数” (Snapshot Strategy)
  if (type === 'novel') {
    if (debounceTimers.has(cosmosId)) {
      clearTimeout(debounceTimers.get(cosmosId));
    }
    
    const timer = setTimeout(() => {
      recalculateWordCount(cosmosId, today);
      debounceTimers.delete(cosmosId);
    }, 5000); // 5秒防抖
    
    debounceTimers.set(cosmosId, timer);
  }
};

async function updateEditsCount(cosmosId: string, type: string, delta: number, today: string) {
  if (!db) return;
  
  try {
    const existing = await db.select().from(daily_stats)
      .where(and(eq(daily_stats.date, today), eq(daily_stats.cosmos_id, cosmosId)))
      .get();

    if (existing) {
      await db.update(daily_stats)
        .set({
          cosmos_edits: type === 'cosmos' ? existing.cosmos_edits + delta : existing.cosmos_edits,
          novel_edits: type === 'novel' ? existing.novel_edits + delta : existing.novel_edits,
          updated_at: new Date()
        })
        .where(eq(daily_stats.id, existing.id));
    } else {
      await db.insert(daily_stats).values({
        id: gen.id(),
        cosmos_id: cosmosId,
        date: today,
        cosmos_edits: type === 'cosmos' ? delta : 0,
        novel_edits: type === 'novel' ? delta : 0,
        novel_word_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (e) {
    console.error("[StatsPlugin] Failed to update edits count", e);
  }
}

async function recalculateWordCount(cosmosId: string, today: string) {
  if (!db) return;

  try {
    const projectDb = getCosmosDb(cosmosId);
    const [result] = await projectDb
      .select({ total: sql<number>`sum(length(${chapters.body}))` })
      .from(chapters);
      
    const currentTotal = result?.total || 0;

    const existing = await db.select().from(daily_stats)
      .where(and(eq(daily_stats.date, today), eq(daily_stats.cosmos_id, cosmosId)))
      .get();

    if (existing) {
      await db.update(daily_stats)
        .set({
          novel_word_count: currentTotal,
          updated_at: new Date()
        })
        .where(eq(daily_stats.id, existing.id));
    } else {
      await db.insert(daily_stats).values({
        id: gen.id(),
        cosmos_id: cosmosId,
        date: today,
        cosmos_edits: 0,
        novel_edits: 0,
        novel_word_count: currentTotal,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    console.log(`[StatsPlugin] Updated word count snapshot for ${cosmosId}: ${currentTotal}`);
  } catch (e) {
    console.error("[StatsPlugin] Failed to recalculate word count", e);
  }
}
