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

export const ChatPanel = () => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [status, setStatus] = useState<"ready" | "loading" | "error" | "streaming" | "submitted">("ready");

  const handleSubmit = useCallback(async (message: { text: string }) => {
    const userMessage = { role: "user", content: message.text };
    setMessages((prev) => [...prev, userMessage]);
    setStatus("submitted");
    
    // 模拟 AI 响应
    setTimeout(() => {
      const assistantMessage = {
        role: "assistant",
        content: "这是一个模拟的 AI 响应。在实际实现中，这里会连接到 AI 服务。",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
    }, 1000);
  }, []);

  const handleNewThread = useCallback(() => {
    setMessages([]);
    setHistoryOpen(false);
  }, []);

  const handleSuggestion = async (prompt: string) => {
    await handleSubmit({ text: prompt });
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-transparent">
      {/* 顶部固定栏 */}
      <div className="flex h-10 flex-none items-center justify-end px-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNewThread}
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
                <div className="py-8 text-center text-xs text-muted-foreground">
                  还没有历史记录
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <Conversation className="flex-1 bg-transparent">
        <ConversationContent className="mx-auto flex w-full flex-col gap-1 p-2">
          {messages.length === 0 ? (
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
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary/10 ml-8"
                    : "bg-muted/50 mr-8"
                )}
              >
                {message.content}
              </div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-0 border-t border-muted-foreground/20 bg-muted-foreground/10">
        <ChatInputEditor
          status={status}
          placeholder="输入你的问题..."
          onSubmit={handleSubmit}
          enableQuote
        />
      </div>
    </div>
  );
};
