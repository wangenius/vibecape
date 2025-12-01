import { streamText } from "ai";
import { Model } from "../Model";

export interface StoryScriptPayload {
  description: string; // 当前情节描述
  last?: string[]; // 上文情节正文数组
  next?: string[]; // 下文情节正文数组
  actants?: string[]; // 本情节涉及的角色描述数组
  extra?: string; // 额外要求
  file?: string; // 可选文件上下文
}

export async function runStoryScript(
  payload: StoryScriptPayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  const modelInstance = await Model.get();

  // 组装 prompt
  let user = "";
  if (payload.last?.length) {
    user += `上文情节:\n${payload.last.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  }
  if (payload.next?.length) {
    user += `\n下文情节:\n${payload.next.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  }
  if (payload.actants?.length) {
    user += `\n本情节中涉及的角色:\n${payload.actants.join("\n")}`;
  }
  user += `\n本情节描述:${payload.description}`;
  if (payload.extra) {
    user += `\n特殊要求:${payload.extra}`;
  }

  const system = `- Role: 你是一位才华横溢的小说创作大师，擅长构建精彩而连贯的情节细纲。
- Goals:\n  1. 根据上下文情节和当前情节描述，创作一段完整、生动且合理的情节细纲。\n  2. 直接输出高质量的情节细纲内容。\n- Constraints:\n  1. 控制在500-600字，客观叙述，关注事件进展与角色反应。\n  2. 保持与前后情节紧密连接，遵循世界观设定与角色特性。\n  3. 输出为纯文本，无标题或标记。`;

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
