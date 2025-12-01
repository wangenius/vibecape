import { streamText } from "ai";
import { Model } from "../Model";

export interface GenericJobPayload {
  system?: string;
  user: string;
  files?: string[]; // 预留：若需要文件上下文，可在 provider 层解析 fileid://
}

export async function runGeneric(
  payload: GenericJobPayload,
  opts: { onText: (t: string) => void; onEnd: () => void; onError: (m: string) => void; abortSignal?: AbortSignal }
) {
  const modelInstance = await Model.get();

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (payload.system) messages.push({ role: "system", content: payload.system });
  messages.push({ role: "user", content: payload.user });

  const res = streamText({
    model: modelInstance,
    messages,
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


