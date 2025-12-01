/**
 * LLM 客户端创建函数
 * TODO: 根据实际需求完善实现
 */

export interface LLMClient {
  system: (prompt: string) => LLMClient;
  getId?: () => string;
  stream?: (callback: (chunk: string) => void) => Promise<void>;
  // 可以根据需要添加更多方法
}

/**
 * 创建 LLM 客户端实例
 */
export function createLLM(): LLMClient {
  // TODO: 实现实际的 LLM 客户端创建逻辑
  return {
    system: (prompt: string) => {
      console.log('LLM system prompt:', prompt);
      // TODO: 实现 system 方法
      return createLLM();
    },
  };
}

