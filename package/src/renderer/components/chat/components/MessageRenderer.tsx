"use client";

import { useMemo, useState } from "react";
import { type UIMessage } from "ai";
import { Check, Sparkles, FileText, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Response } from "@/components/ai/response";
import type {
  TextPart,
  ReasoningPart,
  ToolPart,
  ThinkingPart,
} from "@common/types/message";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full items-end justify-end gap-2 py-2",
      from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "is-user:dark flex flex-col gap-2 overflow-hidden rounded-lg text-sm p-1",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[80%] px-4 py-2",
          "group-[.is-user]:bg-transparent group-[.is-user]:text-primary-foreground",
          "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
        ],
        flat: [
          "group-[.is-user]:max-w-[80%]",
          "group-[.is-assistant]:text-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// 引用可视化组件
// ============================================================================

interface RefData {
  type: "doc" | "text";
  docId?: string;
  docTitle?: string;
  text?: string;
  position?: { from: number; to: number };
  context?: { before: string; after: string };
  paragraph?: string;
}

const RefTag = ({ data }: { data: RefData }) => {
  const isDoc = data.type === "doc";

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background border border-border/50 text-xs align-middle mx-0.5 select-none cursor-default">
      {isDoc ? (
        <FileText className="size-3 text-blue-500 shrink-0" />
      ) : (
        <Quote className="size-3 text-orange-500 shrink-0" />
      )}
      <span className="max-w-[120px] truncate text-muted-foreground font-medium">
        {data.docTitle || "未知文档"}
      </span>
    </span>
  );
};

const UserMessageContent = ({ text }: { text: string }) => {
  const parts = useMemo(() => {
    // 匹配 [REF]{...}[/REF]
    const regex = /\[REF\](.*?)\[\/REF\]/g;
    const result: Array<
      { type: "text"; content: string } | { type: "ref"; data: RefData }
    > = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 添加普通文本
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index);
        if (content) {
          result.push({
            type: "text",
            content,
          });
        }
      }

      // 解析引用
      try {
        const refData = JSON.parse(match[1]) as RefData;
        result.push({
          type: "ref",
          data: refData,
        });
      } catch (e) {
        // 解析失败，作为普通文本显示
        result.push({
          type: "text",
          content: match[0],
        });
      }

      lastIndex = regex.lastIndex;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      result.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return result;
  }, [text]);

  return (
    <MessageContent
      className="w-fit max-w-2xl px-3 py-2 rounded-2xl rounded-tr-none bg-muted-foreground/10 text-foreground ml-auto"
      variant="flat"
    >
      <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
        {parts.map((part, index) => {
          if (part.type === "ref") {
            return <RefTag key={index} data={part.data} />;
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    </MessageContent>
  );
};

/** 思考过程折叠区（包含 reasoning + tool calls） */
function ThinkingSection({
  parts,
  isThinking,
  hasText,
}: {
  parts: ThinkingPart[];
  isThinking?: boolean;
  hasText?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // 检测思考是否完成
  const toolParts = parts.filter((p): p is ToolPart =>
    p.type.startsWith("tool-")
  );

  const hasIncompleteTools = toolParts.some(
    (p) => p.state !== "output-available"
  );

  // 如果正在流式传输，且（有未完成的工具调用 或 还没有生成文本），则认为还在思考
  const isStillThinking = isThinking && (hasIncompleteTools || !hasText);

  if (parts.length === 0) return null;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors py-0.5 select-none w-full text-left"
      >
        {isStillThinking ? (
          <Sparkles className="size-3 animate-pulse" />
        ) : (
          <Check className="size-3 text-muted-foreground/40" />
        )}
        <span
          className={
            isStillThinking ? "font-medium animate-pulse" : "font-medium"
          }
        >
          {isStillThinking ? "Thinking..." : "Thought Process"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 max-h-[600px] overflow-y-auto text-[11px] text-muted-foreground/50 leading-5 p-2 bg-muted/30 rounded space-y-2">
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
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 font-mono"
                    >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        <UserMessageContent text={textContent} />
      </Message>
    );
  }

  // 将 parts 分组：连续的 thinking parts 合并，text parts 单独保留
  // 这样可以保持原始顺序，同时将连续的思考内容折叠在一起
  const groupedParts = useMemo(() => {
    const groups: Array<
      | { type: "thinking"; parts: ThinkingPart[] }
      | { type: "text"; part: TextPart }
    > = [];

    for (const part of parts) {
      if (part.type === "reasoning" || part.type.startsWith("tool-")) {
        // 如果上一个 group 也是 thinking，追加到其中
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.type === "thinking") {
          lastGroup.parts.push(part as ThinkingPart);
        } else {
          groups.push({ type: "thinking", parts: [part as ThinkingPart] });
        }
      } else if (part.type === "text") {
        groups.push({ type: "text", part: part as TextPart });
      }
    }

    return groups;
  }, [parts]);

  const hasText = groupedParts.some((g) => g.type === "text");

  return (
    <Message from="assistant" className="w-full p-0">
      <MessageContent variant="flat" className="w-full gap-1 space-y-1">
        {groupedParts.map((group, idx) => {
          if (group.type === "thinking") {
            return (
              <ThinkingSection
                key={idx}
                parts={group.parts}
                isThinking={isStreamingThis}
                hasText={hasText}
              />
            );
          }
          const text = group.part.text?.trim();
          return text ? (
            <div
              key={idx}
              className="text-[13px] leading-5 text-foreground/90 p-1.5"
            >
              <Response>{text}</Response>
            </div>
          ) : null;
        })}
      </MessageContent>
    </Message>
  );
}
