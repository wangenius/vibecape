import { streamText } from "ai";
import { Model } from "../Model";


export interface CreateCosmosPayload {
  seed?: string; // 主题/题材/关键字
  modelHint?: string;
}

export async function runCreateCosmos(
  payload: CreateCosmosPayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  
  const modelInstance = await Model.get();

  const system = `- Role: 世界观架构师。\n- Goals: 基于seed总结世界观、主旨、语气基调、核心设定清单，输出为项目描述草案。\n- Constraints: 中文输出，分段清晰，纯文本。`;
  const user = payload.seed ? `seed: ${payload.seed}` : `请生成一个原创世界观与主旨草案`;

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


