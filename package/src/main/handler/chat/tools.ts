import { tool } from "ai";
import { z } from "zod";

/**
 * 工具定义（用于 streamText）
 */
export const chatTools = {
  getCurrentTime: tool({
    description: "获取当前的日期和时间",
    inputSchema: z.object({}),
    execute: () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString("zh-CN"),
        time: now.toLocaleTimeString("zh-CN"),
        timestamp: now.toISOString(),
        weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
          now.getDay()
        ],
      };
    },
  }),
};
