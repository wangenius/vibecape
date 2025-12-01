import { streamText } from "ai";
import { Model } from "../Model";


export interface ParseLorePayload {
  text: string; // 来源文本（书籍/故事片段）
  modelHint?: string;
}

export async function runParseLore(
  payload: ParseLorePayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  
  const modelInstance = await Model.get();

  const system = `- Role: 世界观设定家。- Goals: 提取关键设定（身份/机构/官职/技能/能力/情感特点等，排除具体角色/物品）。- Output: 结构化 JSON 文本（设定、子设定2-7条）。`;
  const format = `\n\n输出格式示例：\n{
  "设定名称1": { "description": "...", "子设定名称1": "..." },
  "设定名称2": { "description": "...", "子设定名称A": "..." }
}`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: payload.text + format },
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


