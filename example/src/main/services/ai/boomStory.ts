import { streamText } from "ai";
import { Model } from "../Model";

export interface BoomStoryPayload {
  content: string; // 主情节内容或细纲
  count?: number; // 情节数
  extra?: string; // 额外要求
  file?: string; // 可选文件上下文
  modelHint?: string;
}

export async function runBoomStory(
  payload: BoomStoryPayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  const modelInstance = await Model.get();

  const system = `- Role: 你是专业的剧情策划和小说家。
- Goals: 将一个主情节精确拆分为若干子情节，输出结构化文本（JSON风格）。
- Constraints:\n 1. ${payload.count ? `严格 ${payload.count} 段` : `合理分段`}；2. 每段有名称、body、last/next；3. 纯文本；`;

  let user = "";
  user += `主情节：\n${payload.content}`;
  if (payload.extra) user += `\n额外需求：${payload.extra}`;
  if (payload.count) user += `\n拆分数量：${payload.count}`;

  const format = `\n\n输出示例（仅参考格式）：\n{
  "情节名称1": { "body": "...", "last": [], "next": ["情节名称2"], "start": true },
  "情节名称2": { "body": "...", "last": ["情节名称1"], "next": [], "end": true }
}`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user + format },
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
