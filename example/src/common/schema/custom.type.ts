import { sql } from "drizzle-orm";
import { customType, integer, text } from "drizzle-orm/sqlite-core";
import { gen, IdOptions } from "../lib/generator";
/**
 * 通用 JSON 自定义类型
 * 自动处理 JSON 序列化/反序列化
 *
 * @example
 * ```ts
 * const metadata = jsonb<Record<string, any>>()("metadata")
 *   .notNull()
 *   .$defaultFn(() => ({}));
 * ```
 */
export const jsonb = <T>() =>
  customType<{ data: T; driverData: string }>({
    dataType() {
      return "text";
    },
    toDriver(value: T): string {
      return JSON.stringify(value);
    },
    fromDriver(value: string): T {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error("Failed to parse JSON from database:", error);
        // 返回合理的默认值
        return {} as T;
      }
    },
  });

/**
 * 时间戳自定义类型
 * @param name 字段名
 * @returns 时间戳字段
 */
export const timestamp = (
  name: "created_at" | "updated_at" | "last_opened_at" | string = "created_at"
) =>
  integer(name, { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

//id自定义类型
export const id = (name: string = "id", options: IdOptions | string = {}) =>
  text(name)
    .primaryKey()
    .$defaultFn(() => gen.id(options));
