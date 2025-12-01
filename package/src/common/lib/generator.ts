import { nanoid } from "nanoid";

export interface IdOptions {
  length?: number;
  prefix?: string;
  suffix?: string;
  timestamp?: boolean;
}

/** 生成器 */
export const gen = {
  /**
   * 生成一个随机的id
   * @param options 配置选项
   * - prefix: 前缀
   * - suffix: 后缀
   * - timestamp: 是否包含时间戳
   * @returns 生成的id字符串
   */
  id(options: IdOptions | string = {}): string {
    // 处理字符串参数的情况（向后兼容）
    if (typeof options === "string") {
      options = { prefix: options };
    }
    const { prefix = "", suffix = "", timestamp = false, length = 16 } = options;
    const id = nanoid(length);
    const timestampStr = timestamp ? `_${Date.now()}` : "";
    return `${prefix}${id}${timestampStr}${suffix}`;
  },
};
