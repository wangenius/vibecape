import { streamText } from "ai";
import { Model } from "../Model";


export interface StorylizePayload {
  tags?: string[]; // 题材标签
  theme?: string; // 主题
  modelHint?: string;
}

export async function runStorylize(
  payload: StorylizePayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  
  const modelInstance = await Model.get();

  const system = `- Role: 故事工程师。\n- Goals: 结合题材标签与主题，产出可立项的世界观+初步剧情蓝图（非细纲）。\n- Constraints: 中文、纯文本、层次化段落。`;
  const user = `标签：${(payload.tags||[]).join(', ')}\n主题：${payload.theme||''}\n请输出蓝图`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
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


