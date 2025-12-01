import { streamText } from "ai";
import { Model } from "../Model";


export interface CreateActantPayload {
  context?: string; // 相关故事/设定/已有角色摘要
  types?: string[]; // 可选的角色类型集合
  excludeNames?: string[]; // 已存在的角色名，避免重复
  count?: number; // 期望生成数量
  extra?: string;
  modelHint?: string;
}

export async function runCreateActant(
  payload: CreateActantPayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  
  const modelInstance = await Model.get();

  const system = `- Role: 你是专业的角色设计师。
- Goals: 基于上下文生成多样化的 Actant（人物/群体/客体/地点等）。
- Constraints: 1) 描述≈300字；2) 名称与世界观风格一致；3) 避免与 excludeNames 重复；4) 输出结构化 JSON 文本。`;

  let user = "【上下文】\n" + (payload.context || "");
  if (payload.types?.length) user += `\n【可选类型】\n${payload.types.join("、")}`;
  if (payload.excludeNames?.length) user += `\n【已存在】\n${payload.excludeNames.join("、")}`;
  if (payload.count) user += `\n【数量】${payload.count}`;
  if (payload.extra) user += `\n【额外要求】${payload.extra}`;

  const format = `\n\n输出格式（示例，仅供结构参考）：\n{
  "a": { "name": "", "description": "", "type": "" },
  "b": { "name": "", "description": "", "type": "" },
  "relation": [ { "a": "名称1", "b": "名称2", "a_to_b": "xx", "b_to_a": "xx" } ]
}`;

  const res = streamText({
    model: modelInstance,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user + format },
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


