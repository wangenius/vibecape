"use client";

import { useMemo, useState, useEffect } from "react";
import { type UIMessage } from "ai";
import { Check, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import type {
  TextPart,
  ReasoningPart,
  ToolPart,
  ThinkingPart,
} from "@common/types/message";

/** 思考过程折叠区（包含 reasoning + tool calls） */
function ThinkingSection({
  parts,
  isThinking,
}: {
  parts: ThinkingPart[];
  isThinking?: boolean;
}) {
  const [open, setOpen] = useState(true);

  // 检测思考是否完成
  const toolParts = parts.filter((p): p is ToolPart =>
    p.type.startsWith("tool-")
  );

  const hasIncompleteTools = toolParts.some(
    (p) => p.state !== "output-available"
  );
  const isStillThinking = isThinking && hasIncompleteTools;

  // 思考结束后自动折叠
  useEffect(() => {
    if (!isStillThinking && parts.length > 0) {
      const timer = setTimeout(() => setOpen(false), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isStillThinking, parts.length]);

  if (parts.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors py-0.5">
        {isStillThinking ? (
          <Sparkles className="size-3 animate-pulse" />
        ) : (
          <Check className="size-3 text-muted-foreground/40" />
        )}
        <span className="font-medium">
          {isStillThinking ? "Thinking" : "Thought"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5">
        <div className="max-h-[600px] overflow-y-auto text-[11px] text-muted-foreground/50 leading-5 p-2 bg-muted/30 rounded space-y-2">
          {/* 按顺序渲染 */}
          {parts.map((part, idx) => {
            if (part.type === "reasoning") {
              const text = (part as ReasoningPart).text?.trim();
              return text ? (
                <div key={idx} className="whitespace-pre-wrap">
                  {text}
                </div>
              ) : null;
            }
            if (part.type.startsWith("tool-")) {
              const toolPart = part as ToolPart;
              const toolName = toolPart.type.slice(5);
              const isComplete = toolPart.state === "output-available";
              return (
                <div key={idx} className="flex items-start gap-1.5 font-mono">
                  {isComplete ? (
                    <Check className="size-3 text-green-500/70 mt-0.5 shrink-0" />
                  ) : (
                    <div className="size-3 rounded-full border border-muted-foreground/30 animate-pulse mt-0.5 shrink-0" />
                  )}
                  <div>
                    <code>{toolName}</code>
                    {toolPart.output !== undefined && (
                      <span className="text-muted-foreground/30 ml-1 break-all">
                        → {JSON.stringify(toolPart.output)}
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** 错误消息组件 */
export function ErrorMessage({ error }: { error: Error | string }) {
  const errorMessage = typeof error === "string" ? error : error.message;
  return (
    <Message className="w-full p-0" from="assistant">
      <div className="text-xs text-destructive/70 p-1.5">
        {errorMessage || "发生了未知错误"}
      </div>
    </Message>
  );
}

interface MessageRendererProps {
  message: UIMessage;
  index: number;
  messages: UIMessage[];
  isLastMessage: boolean;
  isStreaming: boolean;
  getTextFromMessage: (message: UIMessage) => string;
  onOptionSelect: (formattedText: string) => void;
}

export function MessageRenderer({
  message,
  isLastMessage,
  isStreaming,
}: MessageRendererProps) {
  const parts = useMemo(() => message.parts ?? [], [message.parts]);
  const isStreamingThis =
    isStreaming && isLastMessage && message.role === "assistant";

  // 简单提取文本
  const textContent = useMemo(
    () =>
      (parts.filter((p) => p.type === "text") as TextPart[])
        .map((p) => p.text)
        .join("")
        .trim(),
    [parts]
  );

  if (message.role === "user") {
    return (
      <Message from="user" className="w-full p-0">
        <MessageContent
          className="whitespace-pre-wrap text-[13px] leading-relaxed w-fit max-w-2xl px-3 py-2 rounded-2xl rounded-tr-none bg-muted-foreground/10 text-foreground ml-auto"
          variant="flat"
        >
          {textContent}
        </MessageContent>
      </Message>
    );
  }

  // 分离：所有思考内容 + 所有文本内容
  const thinkingParts = parts.filter(
    (p) => p.type === "reasoning" || p.type.startsWith("tool-")
  ) as ThinkingPart[];
  const textParts = parts.filter((p) => p.type === "text") as TextPart[];

  return (
    <Message from="assistant" className="w-full p-0">
      <MessageContent variant="flat" className="w-full">
        {/* 单个思考折叠区 */}
        <ThinkingSection parts={thinkingParts} isThinking={isStreamingThis} />
        {/* 文本内容 */}
        {textParts.map((part, idx) => {
          const text = part.text?.trim();
          return text ? (
            <div
              key={idx}
              className="text-[13px] leading-5 text-foreground/90 p-1.5"
            >
              <Response>{text}</Response>
            </div>
          ) : null;
        })}
        {/* 流式加载提示 */}
        {isStreamingThis && !textContent && (
          <div className="text-[13px] text-muted-foreground p-1.5 animate-pulse">
            思考中...
          </div>
        )}
      </MessageContent>
    </Message>
  );
}
