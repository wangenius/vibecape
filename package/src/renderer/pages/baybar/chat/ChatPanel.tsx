import type { UIMessage } from "ai";
import type { ChatThreadMeta } from "@common/schema/chat";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  TbHistory,
  TbRotateClockwise,
  TbSparkles,
  TbPlus,
  TbSquareRoundedX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChat, useChatStore } from "@/hook/chat/useChat";
import { useThread } from "@/hook/chat/useThread";
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
import { MessageRenderer } from "./MessageRenderer";
import { Tools } from "@/lib/tools";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MentionNode } from "@/components/editor/extensions/MentionNode";
import { MentionCommand } from "@/components/editor/extensions/MentionCommand";
import { createMentionPlugin } from "@/components/editor/menus/MentionMenu";
import { StopIcon } from "@radix-ui/react-icons";
import { ArrowUp } from "lucide-react";

interface AiChatPanelProps {
  onClose?: () => void;
}

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
  // 使用 hook 订阅该 thread 的状态
  const chatStatus = useChatStore(
    (state) => state.chats.get(thread.id)?.status
  );

  const formatted = Tools.whenWasThat(thread.updated_at);
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
        <span className="shrink-0 text-[9px] text-muted-foreground">
          {formatted}
        </span>
      </div>
    </button>
  );
};

type TextPart = Extract<UIMessage["parts"][number], { type: "text" }>;

const isTextPart = (part: UIMessage["parts"][number]): part is TextPart =>
  part.type === "text";

const getMessageContent = (message: UIMessage) =>
  message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join("")
    .trim();

const suggestionPresets = [
  {
    title: "人物塑造",
    prompt: "帮我设计一个有反转的主角背景，关键词：未来、背叛、自我救赎。",
  },
  {
    title: "剧情推进",
    prompt: "延续当前情节，安排一个充满意外的剧情转折，并解释其合理性。",
  },
  {
    title: "世界观拓展",
    prompt: "为当前世界观补充一条影响深远的历史事件，并说明它对主角的影响。",
  },
  {
    title: "灵感激发",
    prompt: "请给我 3 个符合科幻悬疑主题的剧情灵感，并说明潜在冲突点。",
  },
] as const;

// 定义 ChatInputRef 接口
export interface ChatInputRef {
  setQuote: (text: string) => void;
  clearQuote: () => void;
  focus: () => void;
}

interface ChatInputProps {
  onSubmit: (message: { text: string }) => void | Promise<void>;
  status: "ready" | "loading" | "error" | "streaming" | "submitted";
  onStop?: () => void;
  placeholder?: string;
  enableQuote?: boolean;
}

// 自定义 Tiptap 编辑器组件
const ChatInputEditor = forwardRef<ChatInputRef, ChatInputProps>(
  ({ onSubmit, status, placeholder, onStop, enableQuote }, ref) => {
    const [quote, setQuote] = useState("");
    const mentionPlugin = useMemo(() => createMentionPlugin(), []);
    const isStreaming = status === "streaming" || status === "submitted";

    // 使用 ref 来存储 handleSubmit，以便在 extension 中调用最新的函数
    const handleSubmitRef = useRef<() => void>(() => {});

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
        }),
        Placeholder.configure({
          placeholder: placeholder || "Type @ to reference...",
        }),
        MentionNode,
        MentionCommand.configure({
          suggestion: mentionPlugin,
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
              Enter: () => false, // Explicitly pass through to allow newline
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

    // 监听来自 StoryTreeView 的全局故事 mention 事件
    useEffect(() => {
      if (!editor) return;

      const handleInsertStoryMention = (
        event: Event | CustomEvent<{ id: string; label?: string }>
      ) => {
        const customEvent = event as CustomEvent<{ id: string; label?: string }>;
        const detail = customEvent.detail;
        if (!detail?.id) return;

        editor
          .chain()
          .focus()
          .insertContent({
            type: "mention",
            attrs: {
              id: detail.id,
              label: detail.label || detail.id,
              mentionType: "story",
            },
          })
          .run();
      };

      window.addEventListener(
        "insert-story-mention",
        handleInsertStoryMention as EventListener
      );

      return () => {
        window.removeEventListener(
          "insert-story-mention",
          handleInsertStoryMention as EventListener
        );
      };
    }, [editor]);

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

    // 更新 ref
    useEffect(() => {
      handleSubmitRef.current = handleSubmit;
    }, [handleSubmit]);

    useImperativeHandle(
      ref,
      () => ({
        setQuote: (text: string) => {
          setQuote(text);
          editor?.commands.focus();
        },
        clearQuote: () => {
          setQuote("");
        },
        focus: () => {
          editor?.commands.focus();
        },
      }),
      [editor]
    );

    // 监听 status 变化来禁用/启用编辑器
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
  }
);

ChatInputEditor.displayName = "ChatInputEditor";

interface ChatCoreProps {
  chatId: string; // 对话 ID（始终是真实的 threadId）
}

const ChatCore: React.FC<ChatCoreProps> = ({ chatId }) => {
  const { messages, status, error, sendMessage, stop, regenerate, clearError } =
    useChat(chatId);

  const chatInputRef = useRef<ChatInputRef>(null);

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
    chatInputRef.current?.focus();
    await sendMessage(prompt);
  };

  const handleRetry = () => {
    clearError();
    void regenerate();
  };

  const visibleMessages = messages.filter(
    (message) => message.role !== "system"
  );

  const handleOptionSelect = useCallback((formattedText: string) => {
    if (!formattedText) return;
    chatInputRef.current?.setQuote(formattedText);
    chatInputRef.current?.focus();
  }, []);

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
            visibleMessages.map((message, index) => {
              const isLastMessage = index === visibleMessages.length - 1;
              const isStreamingMessage =
                isStreaming && isLastMessage && message.role === "assistant";

              return (
                <MessageRenderer
                  key={message.id}
                  message={message}
                  index={index}
                  messages={visibleMessages}
                  isLastMessage={isLastMessage}
                  isStreaming={isStreamingMessage}
                  getTextFromMessage={getMessageContent}
                  onOptionSelect={handleOptionSelect}
                />
              );
            })
          )}
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
              <div>生成出错：{error.message || "未知错误"}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs"
                  onClick={handleRetry}
                >
                  <TbRotateClockwise className="mr-1 h-3 w-3" />
                  重试生成
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={clearError}
                >
                  忽略
                </Button>
              </div>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-0 border-t border-muted-foreground/20 bg-muted-foreground/10">
        <ChatInputEditor
          ref={chatInputRef}
          status={inputStatus}
          placeholder="输入你的创作思路，支持 @ 引用..."
          onSubmit={handleInputSubmit}
          onStop={stop}
          enableQuote
        />
      </div>
    </>
  );
};

export const ChatPanel: React.FC<AiChatPanelProps> = () => {
  // UI 状态
  const [historyOpen, setHistoryOpen] = useState(false);

  // 使用 useThread hook 管理对话线程状态（自动初始化）
  const {
    activeChatId,
    historyLoading,
    threadList,
    isInitializing,
    refreshThreads,
    selectThread,
  } = useThread();

  // 历史对话面板打开时刷新列表
  useEffect(() => {
    if (historyOpen) {
      void refreshThreads();
    }
  }, [historyOpen, refreshThreads]);

  // 处理选择对话：关闭历史面板并切换对话
  const handleSelectThread = useCallback(
    async (targetThreadId?: string) => {
      setHistoryOpen(false);
      await selectThread(targetThreadId);
    },
    [selectThread]
  );

  // Command+O 快捷键：在输入框聚焦时创建新对话
  useEffect(() => {
    const handleNewThreadShortcut = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();

      // 检查是否是 Command+O (Mac) 或 Ctrl+O (Windows/Linux)
      const isCommandO = event.metaKey && key === "o";
      const isCtrlO = event.ctrlKey && key === "o";

      if (!(isCommandO || isCtrlO)) return;

      // 检查是否有其他修饰键
      if (event.altKey || event.shiftKey) return;

      // 如果是 Command+O，还要确保 Ctrl 没有按下
      if (isCommandO && event.ctrlKey) return;

      // 如果是 Ctrl+O，还要确保 Meta 没有按下
      if (isCtrlO && event.metaKey) return;

      const activeElement = document.activeElement as HTMLElement | null;

      // 只在聚焦到编辑器时响应 (Tiptap 编辑器通常是 contenteditable div)
      const isEditorFocused = activeElement?.isContentEditable;
      if (!isEditorFocused) return;

      event.preventDefault();

      // 创建新对话并自动聚焦
      void handleSelectThread(undefined).then(() => {
        // 等待组件渲染完成后聚焦
        setTimeout(() => {
          // 尝试找到编辑器并聚焦
          const editor = document.querySelector(".ProseMirror") as HTMLElement;
          if (editor) {
            editor.focus();
          }
        }, 100);
      });
    };

    window.addEventListener("keydown", handleNewThreadShortcut);
    return () => {
      window.removeEventListener("keydown", handleNewThreadShortcut);
    };
  }, [handleSelectThread]);

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
