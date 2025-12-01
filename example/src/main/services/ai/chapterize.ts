import { streamText } from "ai";
import { Model } from "../Model";

export interface ChapterizePayload {
  outline: string; // 情节细纲（story body）
  lastTail?: string; // 上一章尾部文本（可选）
  writingStyle?: string; // 风格名称+描述（可选）
  extra?: string; // 额外需求
}

export async function runChapterize(
  payload: ChapterizePayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  const modelInstance = await Model.get();

  const system = `- Role: 网络小说家，擅长使用网文风格写作。
- Goals: 根据提供的情节细纲（细纲）、角色状态和关系信息，生成对应的章节正文。
- Constraints:\n 1. 严格遵循细纲，控制在约3000字；2. 不添加标题；3. 节奏自然；4. 允许根据 lastTail 衔接；`;

  let user = `【细纲】\n${payload.outline}`;
  if (payload.lastTail) user += `\n\n【上章尾部正文】${payload.lastTail}`;
  if (payload.writingStyle) user += `\n\n【写作风格】${payload.writingStyle}`;
  if (payload.extra) user += `\n\n【额外需求】${payload.extra}`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
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
