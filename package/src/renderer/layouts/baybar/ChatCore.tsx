import { useCallback, useState, useEffect } from "react";
import { TbSparkles } from "react-icons/tb";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/chat/ai/conversation";
import { useChat } from "@/hooks/chat/useChat";
import type { UIMessage } from "ai";
import { MessageRenderer, ErrorMessage } from "../../components/chat/components/MessageRenderer";
import { ChatInputEditor, ChatInputProps } from "../../components/chat/components/ChatInputEditor";

// 预设建议
const suggestionPresets = [
  {
    title: "文档润色",
    prompt: "帮我润色当前文档，使其更加流畅易读。",
  },
  {
    title: "内容扩展",
    prompt: "根据当前内容，帮我扩展更多相关的细节描述。",
  },
  {
    title: "结构优化",
    prompt: "帮我优化当前文档的结构，使其逻辑更清晰。",
  },
  {
    title: "写作建议",
    prompt: "对当前文档给出一些写作改进建议。",
  },
] as const;

// 获取消息文本内容
type TextPart = Extract<UIMessage["parts"][number], { type: "text" }>;
const isTextPart = (part: UIMessage["parts"][number]): part is TextPart =>
  part.type === "text";
const getTextFromMessage = (message: UIMessage) =>
  message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join("")
    .trim();

interface ChatCoreProps {
  chatId: string;
}

export const ChatCore: React.FC<ChatCoreProps> = ({ chatId }) => {
  const { messages, status, error, sendMessage, stop, getQueueLength } = useChat(chatId);
  const [queueLength, setQueueLength] = useState(0);

  // 定期检查队列长度
  useEffect(() => {
    const updateQueueLength = () => {
      setQueueLength(getQueueLength());
    };
    updateQueueLength();
    const interval = setInterval(updateQueueLength, 200);
    return () => clearInterval(interval);
  }, [getQueueLength]);

  const isStreaming = status === "streaming" || status === "submitted";

  const resolveInputStatus = useCallback((): ChatInputProps["status"] => {
    if (error || status === "error") return "error";
    if (status === "streaming" || status === "submitted")
      return status as ChatInputProps["status"];
    return "ready";
  }, [status, error]);

  const inputStatus = resolveInputStatus();

  const handleInputSubmit = useCallback(
    async (message: { text?: string }) => {
      const text = message.text?.trim();
      if (!text) return;
      await sendMessage(text);
    },
    [sendMessage]
  );

  const handleSuggestion = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const visibleMessages = messages.filter(
    (message) => message.role !== "system"
  );

  return (
    <>
      <Conversation className="flex-1 bg-transparent">
        <ConversationContent className="mx-auto flex w-full flex-col gap-1 p-2">
          {visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 px-4">
              <div className="flex flex-col items-center gap-3">
                <TbSparkles className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground/60 tracking-wide">
                  开始对话
                </p>
              </div>
              <div className="w-full max-w-md flex flex-col gap-2">
                {suggestionPresets.map((item) => (
                  <button
                    key={item.prompt}
                    onClick={() => void handleSuggestion(item.prompt)}
                    className="group relative rounded-lg border border-border/40 bg-transparent px-4 py-3 text-left transition-all duration-200 hover:border-border/80 hover:bg-muted/30"
                  >
                    <div className="text-xs font-medium text-foreground/90 mb-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            visibleMessages.map((message, index) => (
              <MessageRenderer
                key={message.id}
                message={message}
                index={index}
                messages={visibleMessages}
                isLastMessage={index === visibleMessages.length - 1}
                isStreaming={isStreaming}
                getTextFromMessage={getTextFromMessage}
                onOptionSelect={() => {}}
              />
            ))
          )}
          {error && <ErrorMessage error={error} />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="m-2 rounded-xl bg-muted-foreground/10">
        <ChatInputEditor
          status={inputStatus}
          onSubmit={handleInputSubmit}
          onStop={stop}
          enableQuote
          queueLength={queueLength}
        />
      </div>
    </>
  );
};
