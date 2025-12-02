import { useState, useRef, useCallback, useEffect } from "react";
import { TbHistory, TbSparkles, TbPlus, TbSquareRoundedX } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { StopIcon } from "@radix-ui/react-icons";
import { ArrowUp } from "lucide-react";
import { useChat, useChatStore } from "@/hook/chat/useChat";
import { useThread } from "@/hook/chat/useThread";
import type { UIMessage } from "ai";
import type { ChatThreadMeta } from "@common/schema/chat";
import { MessageRenderer, ErrorMessage } from "./chat/MessageRenderer";

interface ChatInputProps {
  onSubmit: (message: { text: string }) => void | Promise<void>;
  status: "ready" | "loading" | "error" | "streaming" | "submitted";
  onStop?: () => void;
  placeholder?: string;
  enableQuote?: boolean;
}

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

// 自定义 Tiptap 编辑器组件
const ChatInputEditor = ({
  onSubmit,
  status,
  placeholder,
  onStop,
  enableQuote,
}: ChatInputProps) => {
  const [quote, setQuote] = useState("");
  const isStreaming = status === "streaming" || status === "submitted";
  const handleSubmitRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "输入消息...",
      }),
      Extension.create({
        name: "chatInputKeymap",
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": () => {
              if (this.editor.isEmpty) return false;
              handleSubmitRef.current();
              return true;
            },
            Enter: () => false,
          };
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none w-full focus:outline-none max-h-[200px] overflow-y-auto p-3 min-h-[50px] bg-transparent placeholder:text-muted-foreground/60 text-sm",
        "data-chat-input": "true",
      },
    },
  });

  const handleSubmit = useCallback(() => {
    if (!editor || editor.isEmpty) return;
    const text = editor.getText();
    if (!text.trim()) return;

    let finalMessage = text;
    if (enableQuote && quote) {
      finalMessage = `[QUOTE_START]\n${quote}\n[QUOTE_END]\n\n${text}`;
      setQuote("");
    }

    onSubmit({ text: finalMessage });
    editor.commands.clearContent();
  }, [editor, quote, enableQuote, onSubmit]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isStreaming);
    }
  }, [editor, isStreaming]);

  return (
    <div className="w-full p-1 shadow-none ring-0 ring-offset-0 outline-none rounded-2xl transition-colors items-start flex flex-col gap-2">
      {enableQuote && quote && (
        <div className="relative rounded-2xl bg-muted-foreground/10 p-3 animate-in slide-in-from-bottom-2 w-full self-start">
          <div className="text-sm text-foreground/50 pr-6 max-h-24 overflow-y-auto">
            {quote}
          </div>
          <Button
            onClick={() => setQuote("")}
            className="absolute top-2 right-2 h-5 w-5 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            size={"icon"}
            variant={"ghost"}
          >
            <TbSquareRoundedX className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="relative w-full">
        <EditorContent editor={editor} />
        <div className="flex justify-end p-1">
          {isStreaming && onStop ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="size-6 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/40"
              variant={"secondary"}
              title="停止生成"
            >
              <StopIcon className="h-4 w-4 stroke-3" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isStreaming || editor?.isEmpty}
              size="icon"
              className="size-6 rounded-full"
              variant="default"
            >
              <ArrowUp className="h-4 w-4 stroke-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// 线程列表项组件
interface ThreadListItemProps {
  thread: ChatThreadMeta;
  isActive: boolean;
  onSelect: (threadId: string) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isActive,
  onSelect,
}) => {
  const chatStatus = useChatStore(
    (state) => state.chats.get(thread.id)?.status
  );
  const isStreaming = chatStatus === "streaming" || chatStatus === "submitted";

  return (
    <button
      onClick={() => onSelect(thread.id)}
      className={cn(
        "w-full rounded-md px-2 py-1.5 text-left transition",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isStreaming && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </span>
          )}
          <span className="truncate text-[11px] font-medium">
            {thread.title || "未命名会话"}
          </span>
        </div>
      </div>
    </button>
  );
};

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

// 聊天核心组件
interface ChatCoreProps {
  chatId: string;
}

const ChatCore: React.FC<ChatCoreProps> = ({ chatId }) => {
  const { messages, status, error, sendMessage, stop } = useChat(chatId);

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

      <div className="p-0 border-t border-muted-foreground/20 bg-muted-foreground/10">
        <ChatInputEditor
          status={inputStatus}
          placeholder="输入你的问题..."
          onSubmit={handleInputSubmit}
          onStop={stop}
          enableQuote
        />
      </div>
    </>
  );
};

export const ChatPanel = () => {
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    activeChatId,
    historyLoading,
    threadList,
    isInitializing,
    refreshThreads,
    selectThread,
  } = useThread();

  useEffect(() => {
    if (historyOpen) {
      void refreshThreads();
    }
  }, [historyOpen, refreshThreads]);

  const handleSelectThread = useCallback(
    async (targetThreadId?: string) => {
      setHistoryOpen(false);
      await selectThread(targetThreadId);
    },
    [selectThread]
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-transparent">
      {/* 顶部固定栏 */}
      <div className="flex h-10 flex-none items-center justify-end px-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => void handleSelectThread(undefined)}
            title="新建对话"
          >
            <TbPlus className="h-3.5 w-3.5" />
          </Button>

          <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="历史会话"
              >
                <TbHistory className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-72 p-2"
              sideOffset={5}
            >
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <h4 className="text-xs font-medium text-foreground">
                    历史对话
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    切换到之前的对话
                  </p>
                </div>
                <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
                  {historyLoading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      加载中...
                    </div>
                  ) : threadList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      还没有历史记录
                    </div>
                  ) : (
                    threadList.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeChatId}
                        onSelect={(threadId) =>
                          void handleSelectThread(threadId)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 聊天核心组件 */}
      {isInitializing ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">初始化中...</div>
        </div>
      ) : activeChatId ? (
        <ChatCore key={activeChatId} chatId={activeChatId} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            加载失败，请尝试新建对话
          </div>
        </div>
      )}
    </div>
  );
};
