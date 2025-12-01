import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import { cosmos_metas } from "../../common/schema/cosmos_metas";
import { ensureSchema } from "./ensure-schema";

// 全局元数据数据库路径
const metasPath = path.join(process.cwd(), "data", "metas.db");
fs.mkdirSync(path.dirname(metasPath), { recursive: true });

const client = createClient({
  url: `file:${metasPath}`,
});

// 元数据数据库的 schema
const metasSchema = {
  metaList: cosmos_metas,
};

export const metasDb = drizzle(client, { schema: metasSchema });
export const metasClient = client;

// 初始化元数据数据库
// 运行时从 schema 生成并执行 SQL
export async function initMetasDatabase(): Promise<void> {
  try {
    // 运行时从 schema 生成并执行建表 SQL
    await ensureSchema(metasClient, metasDb, { metaList: cosmos_metas });

    console.log("元数据数据库初始化完成");
  } catch (error) {
    console.error("元数据数据库初始化失败:", error);
    throw error;
  }
}
