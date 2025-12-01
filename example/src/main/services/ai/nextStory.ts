import { streamText } from "ai";
import { Model } from "../Model";


export interface NextStoryPayload {
  context?: string; // 现有故事正文或细纲
  description?: string; // 当前描述
  extra?: string; // 额外要求
  modelHint?: string;
}

export async function runNextStory(
  payload: NextStoryPayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  
  const modelInstance = await Model.get();

  const system = `- Role: 你是一个文学家和小说家。
- Goals: 在给定的故事上下文基础上为下一段情节生成清晰的细纲。
- Constraints:\n 1. 仅输出下一段情节的细纲，300-600字；\n 2. 风格与上下文一致；\n 3. 纯文本，无标题与标记；`;

  let user = "";
  if (payload.context) user += `现有上下文：\n${payload.context}\n`;
  if (payload.description) user += `当前描述：\n${payload.description}\n`;
  if (payload.extra) user += `额外要求：\n${payload.extra}\n`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user || "请基于上下文续写情节细纲" },
    ],
    abortSignal: opts.abortSignal,
    onChunk: ({ chunk }) => { if (chunk.type === "text-delta") opts.onText(chunk.text); },
    onFinish: () => opts.onEnd(),
    onError: ({ error }) => {
      const msg = (error && typeof error === "object" && "message" in error)
        ? String((error as { message: unknown }).message)
        : "生成失败";
      opts.onError(msg);
    },
  });
  res.consumeStream();
}


