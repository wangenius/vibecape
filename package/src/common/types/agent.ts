/**
 * Agent 类型定义（前后端共享）
 */

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  isDefault?: boolean;
}
