"use client";

import { useMemo } from "react";
import { type UIMessage } from "ai";
import { Check, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

/** 工具调用展示组件 */
function ToolCallDisplay({
  toolName,
  input,
  output,
  isComplete,
}: {
  toolName: string;
  input?: unknown;
  output?: unknown;
  isComplete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = input !== undefined || output !== undefined;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-1">
      <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
        {isComplete ? (
          <Check className="size-2.5 text-green-500/70" />
        ) : (
          <div className="size-2.5 rounded-full border border-muted-foreground/30 animate-pulse" />
        )}
        <code className="font-mono">{toolName}</code>
        {hasDetails && (
          <ChevronDown className={`size-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </CollapsibleTrigger>
      {hasDetails && (
        <CollapsibleContent className="mt-1 ml-3.5 text-[10px] text-muted-foreground/40 font-mono">
          {input !== undefined && (
            <div className="mb-0.5">
              <span className="text-muted-foreground/30">输入: </span>
              <span className="break-all">{JSON.stringify(input)}</span>
            </div>
          )}
          {output !== undefined && (
            <div>
              <span className="text-muted-foreground/30">输出: </span>
              <span className="break-all">{JSON.stringify(output)}</span>
            </div>
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

/** 错误消息组件 */
export function ErrorMessage({ error }: { error: Error | string }) {
  const errorMessage = typeof error === "string" ? error : error.message;
  return (
    <Message className="w-full p-0" from="assistant">
      <div className="text-xs text-destructive/70 p-1.5">{errorMessage || "发生了未知错误"}</div>
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
  const isStreamingThis = isStreaming && isLastMessage && message.role === "assistant";

  // 简单提取文本
  const textContent = useMemo(() => 
    parts.filter((p) => p.type === "text").map((p: any) => p.text).join("").trim()
  , [parts]);

  if (message.role === "user") {
    return (
      <Message from="user" className="w-full p-0">
        <MessageContent
          className="whitespace-pre-wrap text-xs leading-relaxed w-fit max-w-2xl px-3 py-2 rounded-2xl rounded-tr-none bg-muted-foreground/10 text-foreground ml-auto"
          variant="flat"
        >
          {textContent}
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant" className="w-full p-0">
      <MessageContent variant="flat" className="w-full">
        {/* 直接按顺序渲染 parts */}
        {parts.map((part, idx) => {
          if (part.type === "reasoning") {
            const text = (part as any).text?.trim();
            return text ? (
              <p key={idx} className="text-[10px] text-muted-foreground/40 leading-4 whitespace-pre-wrap mb-1">
                {text}
              </p>
            ) : null;
          }
          if (part.type.startsWith("tool-")) {
            const toolName = part.type.slice(5); // 移除 "tool-" 前缀
            const toolPart = part as { state?: string; input?: unknown; output?: unknown };
            const isComplete = toolPart.state === "output-available";
            return (
              <ToolCallDisplay
                key={idx}
                toolName={toolName}
                input={toolPart.input}
                output={toolPart.output}
                isComplete={isComplete}
              />
            );
          }
          if (part.type === "text") {
            const text = (part as any).text?.trim();
            return text ? (
              <div key={idx} className="text-xs leading-5 text-foreground/90 p-1.5">
                <Response>{text}</Response>
              </div>
            ) : null;
          }
          return null;
        })}
        {/* 流式加载提示 */}
        {isStreamingThis && !textContent && (
          <div className="text-xs text-muted-foreground p-1.5 animate-pulse">思考中...</div>
        )}
      </MessageContent>
    </Message>
  );
}
