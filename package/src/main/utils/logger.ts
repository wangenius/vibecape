/**
 * 日志系统
 * 提供统一的日志格式和级别控制
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

// 日志级别优先级
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 当前最小日志级别（可通过环境变量配置）
const MIN_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || "info";

// 颜色代码
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
};

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(11, 23); // HH:mm:ss.SSS
}

/**
 * 格式化数据对象
 */
function formatData(data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return "";

  const entries = Object.entries(data)
    .map(([k, v]) => {
      const value = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}=${value}`;
    })
    .join(" ");

  return ` ${COLORS.dim}${entries}${COLORS.reset}`;
}

/**
 * 日志记录器类
 */
export class Logger {
  constructor(private module: string) {}

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = formatTimestamp();
    const levelColor = LEVEL_COLORS[level];
    const levelStr = level.toUpperCase().padEnd(5);

    const formatted = `${COLORS.dim}${timestamp}${COLORS.reset} ${levelColor}${levelStr}${COLORS.reset} ${COLORS.cyan}[${this.module}]${COLORS.reset} ${message}${formatData(data)}`;

    switch (level) {
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.log(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
        console.error(formatted);
        break;
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  /**
   * 信息日志
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  /**
   * 错误日志
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  /**
   * 带异常堆栈的错误日志
   */
  exception(message: string, error: Error, data?: Record<string, unknown>): void {
    this.error(message, {
      ...data,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 3).join(" -> "),
    });
  }
}

/**
 * 创建模块日志记录器
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}

// 预创建的通用日志器
export const log = createLogger("App");
