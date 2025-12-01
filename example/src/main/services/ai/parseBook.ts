import { streamText } from "ai";
import { Model } from "../Model";

export interface ParseBookPayload {
  fileId: string;
  modelHint?: string;
}

// 简化版：围绕文件内容进行章节结构与设定/角色抽取的分阶段提示，统一以流式文本输出进度与结果摘要
export async function runParseBook(
  payload: ParseBookPayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  const modelInstance = await Model.get();

  const system = `- Role: 你是高级文学分析专家，擅长结构化分析书籍内容并提取设定、角色与情节流线。\n- Output: 分阶段输出：\n阶段1：世界观与主旨总结；\n阶段2：设定与子设定摘要；\n阶段3：角色与关系摘要；\n阶段4：3-7个大事部分流线摘要（last/next）；`;

  const user = `文件引用：fileid://${payload.fileId}\n请按阶段逐步输出分析结果，直接输出正文，不要解释。`;

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


