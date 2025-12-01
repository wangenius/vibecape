"use client";

import { useMemo, useState, useEffect } from "react";
import { type ReasoningUIPart, type ToolUIPart, type UIMessage } from "ai";
import {
  FileText,
  CornerDownRight, ChevronRight,
  Loader2,
  Sparkles,
  Check,
  AlertCircle
} from "lucide-react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { dialog } from "@/components/custom/DialogModal";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * 解析消息中的文件标记
 * 格式：[FILE]url|filename[/FILE]
 */
export interface ParsedFile {
  url: string;
  name: string;
}

export function parseFiles(text: string): {
  parts: Array<{ type: "text" | "file"; content: string | ParsedFile }>;
} {
  const parts: Array<{
    type: "text" | "file";
    content: string | ParsedFile;
  }> = [];

  // 匹配 [FILE]url|filename[/FILE] 格式
  const fileRegex = /\[FILE\]([^|]+)\|([^\]]+)\[\/FILE\]/g;

  let lastIndex = 0;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    // 添加文件标记之前的文本
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText.trim()) {
        parts.push({ type: "text", content: beforeText });
      }
    }

    const [, url, name] = match;
    parts.push({
      type: "file",
      content: {
        url: url.trim(),
        name: name.trim(),
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // 如果没有找到任何文件，返回整个文本
  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return { parts };
}

/**
 * 解析消息中的引用标记
 * 支持格式：
 * - [QUOTE_START]\nquote text\n[QUOTE_END]\n\nmessage text
 * - [QUOTE_START=/docs/xxx/xxx]\nquote text\n[QUOTE_END]\n\nmessage text
 */
export interface ParsedQuote {
  hasQuote: boolean;
  quote: string;
  message: string;
  path?: string;
}

export function parseQuote(text: string): ParsedQuote {
  // 可选路径部分：=...，例如 =/docs/xxx/xxx
  const quoteRegex =
    /\[QUOTE_START(?:=([^\]]+))?\]\n([\s\S]*?)\n\[QUOTE_END\]\n\n([\s\S]*)/;
  const match = text.match(quoteRegex);

  if (match) {
    return {
      hasQuote: true,
      path: match[1] || undefined,
      quote: match[2],
      message: match[3],
    };
  }

  return {
    hasQuote: false,
    quote: "",
    message: text,
  };
}

type ThinkingPart = ReasoningUIPart | ToolUIPart;

/**
 * 文件显示组件 - 极简风格
 */
function FileDisplay({ file }: { file: ParsedFile }) {
  return (
    <div
      onClick={() => {
        dialog.confirm({
          title: "是否下载文档",
          content: file.name,
          onOk: () => {
            window.open(file.url, "_blank");
          },
        });
      }}
      className="inline-flex select-none items-center gap-2 px-3 py-1.5 rounded-md border border-border/40 bg-background/50 hover:bg-muted/50 transition-colors group w-fit cursor-pointer"
    >
      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-foreground/70 truncate max-w-[200px]">
        {file.name}
      </span>
    </div>
  );
}

/**
 * 用户消息内容组件 - 极简风格
 */
function UserMessageContent({
  parsedQuote,
}: {
  parsedQuote: ParsedQuote;
  parsedFiles: {
    parts: Array<{ type: "text" | "file"; content: string | ParsedFile }>;
  };
}) {
  // 首先处理引用，然后处理文件
  const messageWithoutQuote = parsedQuote.message;
  const parsedFilesFromMessage = parseFiles(messageWithoutQuote);

  const hasFiles = parsedFilesFromMessage.parts.some((p) => p.type === "file");
  const textParts = parsedFilesFromMessage.parts.filter(
    (p) => p.type === "text"
  );
  const hasText =
    textParts.length > 0 && textParts.some((p) => (p.content as string).trim());

  return (
    <div className="flex flex-col items-end w-full gap-1">
      {/* 引用内容显示 - 最上面 */}
      {parsedQuote.hasQuote && (
        <div className="text-xs text-muted-foreground/70 pr-3 border-r-2 border-muted pl-2 mb-1 max-w-[90%]">
          <CornerDownRight className="h-3 w-3 inline mr-1.5 text-muted-foreground/50" />
          {parsedQuote.quote.length > 80
            ? parsedQuote.quote.slice(0, 80) + "..."
            : parsedQuote.quote}
        </div>
      )}

      {/* 文件显示区域 */}
      {hasFiles && (
        <div className="flex flex-wrap justify-end gap-2 w-full">
          {parsedFilesFromMessage.parts
            .filter((p) => p.type === "file")
            .map((part, idx) => {
              const file = part.content as ParsedFile;
              return <FileDisplay key={idx} file={file} />;
            })}
        </div>
      )}

      {/* 文本内容 */}
      {hasText && (
        <MessageContent
          className="whitespace-pre-wrap wrap-break-words text-xs leading-relaxed w-fit max-w-2xl px-3! py-2! rounded-2xl rounded-tr-none bg-muted-foreground/10 text-foreground"
          variant="flat"
        >
          {textParts.map((part, idx) => {
            const content = (part.content as string).trim();
            return <span key={idx}>{content}</span>;
          })}
        </MessageContent>
      )}
    </div>
  );
}

/**
 * 思考过程组件 - 极简折叠风格
 */
function ThinkingProcess({
  reasoningTexts,
  toolParts,
  isStreaming,
}: {
  reasoningTexts: string[];
  toolParts: ToolUIPart[];
  isStreaming: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  // 监听流式状态，开始时自动打开，结束时自动关闭
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isStreaming]);

  if (reasoningTexts.length === 0 && toolParts.length === 0) return null;

  const hasActiveToolCall = toolParts.some(
    (part) => part.state !== "output-available" && part.state !== "output-error"
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full group/thinking my-2"
    >
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors duration-200",
            isOpen
              ? "text-muted-foreground/80"
              : "text-muted-foreground/40 hover:text-muted-foreground/80"
          )}
        >
          {isStreaming || hasActiveToolCall ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          <span className="text-[11px] font-medium tracking-wide">
            {isStreaming ? "THINKING" : "PROCESS"}
          </span>
          {!isStreaming && (
            <ChevronRight
              className={cn(
                "size-3 transition-transform duration-200 opacity-50",
                isOpen ? "rotate-90" : ""
              )}
            />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <div className="mt-3 mb-1 ml-1 space-y-4">
          {/* 推理内容 */}
          {reasoningTexts.length > 0 && (
            <div className="text-muted-foreground/60 text-[13px] leading-relaxed font-light space-y-2">
              {reasoningTexts.map((text, idx) => (
                <div
                  key={idx}
                  className="whitespace-pre-wrap animate-in fade-in duration-500 pl-3 border-l border-border/30"
                >
                  {text}
                </div>
              ))}
            </div>
          )}

          {/* 工具调用 */}
          {toolParts.length > 0 && (
            <div className="space-y-2 pl-3 border-l border-border/30">
              {toolParts.map((toolPart, idx) => {
                const methodName = toolPart.type.split("-").slice(1).join("_");

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs animate-in fade-in slide-in-from-left-1 duration-300 text-muted-foreground/50"
                  >
                    <Check className="size-3" />
                    <code className="font-mono text-[10px]">{methodName}</code>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 错误消息组件
 */
export function ErrorMessage({ error }: { error: Error | string }) {
  const errorMessage = typeof error === "string" ? error : error.message;
  return (
    <Message className="w-full" from="assistant">
      <div className="flex w-full gap-2">
        <div className="size-8 shrink-0 flex items-center justify-center rounded-full bg-destructive/10 self-end mb-1">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-sm border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive-foreground max-w-[90%]">
          <p className="font-medium mb-1">生成出错</p>
          <p className="opacity-90">{errorMessage || "发生了未知错误"}</p>
        </div>
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
  isStreaming,
  getTextFromMessage,
}: MessageRendererProps) {
  const parts = useMemo(() => message.parts ?? [], [message.parts]);
  const messageText = getTextFromMessage(message);

  // 解析用户消息中的文件
  const parsedFiles = useMemo(() => {
    return message.role === "user" && messageText
      ? parseFiles(messageText)
      : { parts: [] };
  }, [messageText, message.role]);

  // 解析用户消息中的引用
  const parsedQuote = useMemo(() => {
    return message.role === "user" && messageText
      ? parseQuote(messageText)
      : { hasQuote: false, quote: "", message: messageText };
  }, [messageText, message.role]);

  const segments = useMemo(() => {
    if (message.role !== "assistant")
      return [] as (
        | { kind: "thinking"; parts: ThinkingPart[] }
        | { kind: "text"; text: string }
      )[];

    const result: (
      | { kind: "thinking"; parts: ThinkingPart[] }
      | { kind: "text"; text: string }
    )[] = [];

    let currentThinking: ThinkingPart[] = [];
    let currentTextParts: string[] = [];

    const flushThinking = () => {
      if (currentThinking.length === 0) return;
      result.push({ kind: "thinking", parts: currentThinking });
      currentThinking = [];
    };

    const flushText = () => {
      if (currentTextParts.length === 0) return;
      const text = currentTextParts.join("").trim();
      if (text) {
        result.push({ kind: "text", text });
      }
      currentTextParts = [];
    };

    for (const part of parts) {
      if (part.type === "reasoning" || part.type.startsWith("tool-")) {
        flushText();
        currentThinking.push(part as ThinkingPart);
      } else if (part.type === "text") {
        flushThinking();
        if (part.text) {
          currentTextParts.push(part.text);
        }
      }
    }

    flushThinking();
    flushText();

    // 方案 A：如果正在流式且还没有任何真实片段，注入一个空文本 segment
    if (isStreaming && result.length === 0) {
      return [{ kind: "text" as const, text: "" }];
    }

    return result;
  }, [message.role, parts, isStreaming]);

  return (
    <Message className={"w-full p-0"} key={message.id} from={message.role}>
      {message.role === "assistant" ? (
        <MessageContent variant="flat" className="w-full gap-1">
          <div
            className={cn(
              "w-full space-y-1",
              isStreaming && segments.length === 0 && "animate-pulse"
            )}
          >
            {segments.map(
              (
                segment:
                  | { kind: "thinking"; parts: ThinkingPart[] }
                  | { kind: "text"; text: string },
                segmentIndex: number
              ) => {
                if (segment.kind === "thinking") {
                  const segmentThinkingParts = segment.parts;
                  const reasoningTexts = segmentThinkingParts
                    .filter((part: ThinkingPart) => part.type === "reasoning")
                    .map((part: ThinkingPart) =>
                      (part as ReasoningUIPart).text?.trim()
                    )
                    .filter((text): text is string => Boolean(text));

                  const toolParts = segmentThinkingParts.filter((part) =>
                    part.type.startsWith("tool-")
                  ) as ToolUIPart[];

                  return (
                    <ThinkingProcess
                      key={`${message.id}-thinking-${segmentIndex}`}
                      reasoningTexts={reasoningTexts}
                      toolParts={toolParts}
                      isStreaming={isStreaming}
                    />
                  );
                }

                // 文本片段
                const text = segment.text ?? "";
                const hasText = text.trim().length > 0;

                return (
                  <div
                    key={`${message.id}-text-${segmentIndex}`}
                    className="text-xs leading-5 group relative text-foreground/90 p-1.5"
                  >
                    {hasText && <Response>{text}</Response>}
                  </div>
                );
              }
            )}
          </div>
        </MessageContent>
      ) : (
        <UserMessageContent
          parsedQuote={parsedQuote}
          parsedFiles={parsedFiles}
        />
      )}
    </Message>
  );
}
