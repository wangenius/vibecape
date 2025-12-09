/**
 * 通用工具集
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * 通用工具 - 所有 Hero 可用
 */
export const commonTools = {
  /**
   * 获取当前日期和时间
   */
  getCurrentTime: tool({
    description: "获取当前的日期和时间",
    inputSchema: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString("zh"),
        time: now.toLocaleTimeString("zh"),
        timestamp: now.toISOString(),
        weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
          now.getDay()
        ],
      };
    },
  }),
};
