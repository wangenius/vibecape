import { streamText } from "ai";
import { Model } from "../Model";

export async function runOptimise(text: string, opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal; }) {
  const modelInstance = await Model.get();

  const system = `- Role: 你是资深中文文本编辑与润色专家。
- Goals: 在不改变原意的前提下对文本进行润色、结构优化、语气统一与可读性提升；尽量保持原有风格。
- Constraints:\n1. 保持中文输出；2. 只输出润色后的正文；3. 不添加标题或解释；4. 若原文有列表、段落结构，保持结构合理性。`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: text },
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


