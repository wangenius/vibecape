import { streamText } from "ai";
import { Model } from "../Model";

export interface ActantActionPayload {
  actantName: string;
  storyContent: string; // 故事正文/细纲
  modelHint?: string;
}

export async function runActantAction(
  payload: ActantActionPayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  const modelInstance = await Model.get();

  const system = `### 角色定位\n- 你是一位精通文本分析的专家，擅长识别并提取人物经历\n- 你的任务是从故事内容中提取角色【${payload.actantName}】的关键经历\n\n### 提取要求\n- 准确：确保提取的内容真实反映角色经历，不添加臆测\n- 聚焦：只关注角色【${payload.actantName}】，忽略其他角色信息\n- 简洁：总结不超过200字，保留最具关键性的经历细节\n- 完整：捕捉角色的关键活动、决策、情感变化和重要事件\n\n### 输出格式\n直接输出简洁的文字总结，无需解释过程或添加标题`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: payload.storyContent },
    ],
    abortSignal: opts.abortSignal,
    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") opts.onText(chunk.text);
    },
    onFinish: () => opts.onEnd(),
    onError: ({ error }) => {
      const msg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "生成失败";
      opts.onError(msg);
    },
  });
  res.consumeStream();
}
