import { streamText } from "ai";
import { Model } from "../Model";

export interface ParseStoryPayload {
  text?: string; // 直接文本
  fileId?: string; // 文件引用
  modelHint?: string;
}

export async function runParseStory(
  payload: ParseStoryPayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  const modelInstance = await Model.get();

  const system = `- Role: 高级文学分析专家。\n- Goals: 将输入文本解析为若干情节节点，节点含 name/description/last/next；形成有向无环结构。\n- Constraints: 名称具体、描述含开始与结束要点；输出结构化JSON。`;

  const source = payload.fileId
    ? `fileid://${payload.fileId}`
    : payload.text || "";
  const user = `请解析以下内容为情节节点：\n${source}\n\n输出示例：{ "节点1": {"description":"...","last":[],"next":["节点2"]} }`;

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
