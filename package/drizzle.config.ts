import { defineConfig } from "drizzle-kit";
import path from "node:path";
import fs from "node:fs";

// 通过环境变量选择数据库
// COSMOS_ID=xxx -> 项目数据库: ./data/xxx/data.db
// 不传 -> 全局设置数据库: ./data/settings.db
// METAS=true -> Metas 数据库: ./data/metas.db
// STATS=true -> Stats 数据库: ./data/stats.db
const cosmosId = process.env.COSMOS_ID;
const isMetas = process.env.METAS === "true";
const isStats = process.env.STATS === "true";

let dbPath: string;
let schemaPath: string;

if (isMetas) {
  // Metas 数据库
  dbPath = path.resolve("./data/metas.db");
  schemaPath = "./src/common/schema/metas.ts";
} else if (isStats) {
  // Stats 数据库
  dbPath = path.resolve("./data/stats.db");
  schemaPath = "./src/common/schema/stats.ts";
} else if (cosmosId) {
  // 项目数据库
  dbPath = path.resolve(`./data/${cosmosId}/data.db`);
  schemaPath = "./src/common/schema/cosmos.ts";
  // 确保项目目录存在
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
} else {
  // 默认：Settings 数据库
  dbPath = path.resolve("./data/app.db");
  schemaPath = "./src/common/schema/app.ts";
}

export default defineConfig({
  schema: schemaPath,
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
