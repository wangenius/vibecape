import { streamText } from "ai";
import { Model } from "../Model";

export async function runBrainstorm(tags: { label: string }[], opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal; }) {
  const modelInstance = await Model.get();

  const system = `- Role: 你是一个世界观设计师，编剧和小说家。
- Goals: 根据用户提示随机生成一个小说的世界观设定，包括时间背景、主要设定、故事核心、主要角色、基本思路、核心矛盾等等，不需要标题。
- Constraints:\n  1. 默认使用中文名称，包括角色、背景等。\n  2. 400 字左右。\n  3. 根据具体的题材选择内容，设定需符合题材要求，避免在现实或者古代题材中出现奇幻或者超自然元素。\n  4. 纯文本输出，不带任何诸如 Markdown、HTML 等格式。`;
  const user = tags?.length
    ? `请你开始生成：\n类型：${tags.map((t) => t.label).join(',')}`
    : `请你开始生成：`;

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
      const msg = (error && typeof error === "object" && "message" in error)
        ? String((error as { message: unknown }).message)
        : "生成失败";
      opts.onError(msg);
    },
  });
  res.consumeStream();
}


