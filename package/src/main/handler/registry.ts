/**
 * IPC Handler 注册中心
 * 提供统一的 IPC 注册、错误处理和日志记录
 */

import { ipcMain, type IpcMainInvokeEvent, type WebContents } from "electron";
import { createLogger } from "../utils/logger";

const logger = createLogger("IPC");

type HandlerFn<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: TArgs
) => TResult | Promise<TResult>;

interface RegisteredHandler {
  channel: string;
  module: string;
  registeredAt: number;
}

// 已注册的 handler 列表
const registeredHandlers: RegisteredHandler[] = [];

/**
 * 包装 handler，添加统一的错误处理和日志
 */
function wrapHandler<TArgs extends unknown[], TResult>(
  channel: string,
  handler: HandlerFn<TArgs, TResult>
): HandlerFn<TArgs, TResult> {
  return async (event, ...args) => {
    const startTime = Date.now();
    try {
      const result = await handler(event, ...args);
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        logger.warn(`[IPC] ${channel} took ${duration}ms`);
      }
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.exception(`[IPC] ${channel} failed`, err);
      throw error;
    }
  };
}

/**
 * 注册 IPC handler
 */
export function registerHandler<TArgs extends unknown[], TResult>(
  channel: string,
  handler: HandlerFn<TArgs, TResult>,
  options?: { module?: string }
): void {
  const moduleName = options?.module ?? "unknown";

  // 检查是否已注册
  const existing = registeredHandlers.find((h) => h.channel === channel);
  if (existing) {
    logger.warn(
      `[IPC] Handler "${channel}" already registered by ${existing.module}, overwriting`
    );
  }

  ipcMain.handle(channel, wrapHandler(channel, handler));

  registeredHandlers.push({
    channel,
    module: moduleName,
    registeredAt: Date.now(),
  });
}

/**
 * 注册多个 handlers
 */
export function registerHandlers(
  handlers: Array<{
    channel: string;
    handler: HandlerFn;
  }>,
  options?: { module?: string }
): void {
  for (const { channel, handler } of handlers) {
    registerHandler(channel, handler, options);
  }
}

/**
 * 获取所有已注册的 handler 信息
 */
export function getRegisteredHandlers(): RegisteredHandler[] {
  return [...registeredHandlers];
}

/**
 * 获取 handler 统计信息
 */
export function getHandlerStats(): {
  total: number;
  byModule: Record<string, number>;
} {
  const byModule: Record<string, number> = {};
  for (const handler of registeredHandlers) {
    byModule[handler.module] = (byModule[handler.module] ?? 0) + 1;
  }
  return {
    total: registeredHandlers.length,
    byModule,
  };
}

/**
 * 发送事件到指定 WebContents
 */
export function sendToRenderer(
  sender: WebContents,
  channel: string,
  ...args: unknown[]
): void {
  try {
    sender.send(channel, ...args);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.exception(`[IPC] Failed to send to ${channel}`, err);
  }
}
