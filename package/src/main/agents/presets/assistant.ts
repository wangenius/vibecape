/**
 * 通用助手 Agent
 */

import { defineAgent } from "../base";
import { commonTools } from "../tools";

export const assistantAgent = defineAgent(
  {
    id: "assistant",
    name: "Nova",
    description: "智能对话助手，可以帮助你完成各种任务",
    avatar: "https://avatar.iran.liara.run/public?username=assistant",
    isDefault: true,
  },
  {
    system: `你是一个智能助手，能够帮助用户完成各种任务。
- 回答问题时要准确、简洁
- 如果不确定，请诚实地说明
- 使用中文回复`,
    tools: commonTools,
    maxSteps: 20,
  }
);
