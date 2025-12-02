import {
  useCallback,
  useState,
  ReactNode,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputMessage,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx";

// 对外暴露的方法接口
export interface ChatInputRef {
  setQuote: (params: { text: string; path?: string }) => void;
  clearQuote: () => void;
  focus: () => void;
}

interface ChatInputProps {
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
  status: "ready" | "loading" | "error" | "streaming" | "submitted";
  onStop?: () => void; // 停止生成的回调
  // 可选配置
  placeholder?: string;
  showModelSwitcher?: boolean;
  showFileUpload?: boolean;
  className?: string;
  inputClassName?: string;
  toolbarChildren?: ReactNode; // 自定义工具栏内容
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  accept?: string; // 文件类型限制
  enableQuote?: boolean; // 是否启用引用功能（默认 false）
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      onSubmit,
      status,
      onStop,
      placeholder = "描述您的营销需求，我会帮您梳理成专业的 Brief",
      className,
      inputClassName,
      toolbarChildren,
      onFocus,
      onBlur,
      autoFocus = false,
      accept = ATTACHMENT_ACCEPT,
      enableQuote = false,
    },
    ref
  ) => {
    const [quote, setQuoteState] = useState<string>("");
    const [quotePath, setQuotePath] = useState<string | undefined>(undefined);

    // 对外暴露方法
    useImperativeHandle(
      ref,
      () => ({
        setQuote: (params: { text: string; path?: string }) => {
          setQuoteState(params.text);
          setQuotePath(params.path);
          // 聚焦到输入框
          setTimeout(() => {
            const textarea = document.querySelector<HTMLTextAreaElement>(
              "textarea[name='message']"
            );
            if (textarea) {
              textarea.focus();
            }
          }, 100);
        },
        clearQuote: () => {
          setQuoteState("");
          setQuotePath(undefined);
        },
        focus: () => {
          const textarea = document.querySelector<HTMLTextAreaElement>(
            "textarea[name='message']"
          );
          if (textarea) {
            textarea.focus();
            const valueLength = textarea.value.length;
            textarea.setSelectionRange(valueLength, valueLength);
          }
        },
      }),
      []
    );

    // 监听全局引用事件
    useEffect(() => {
      const handleSetQuote = (event: Event) => {
        const customEvent = event as CustomEvent<{
          text: string;
          path?: string;
        }>;
        if (customEvent.detail?.text && enableQuote) {
          setQuoteState(customEvent.detail.text);
          setQuotePath(customEvent.detail.path);
          // 聚焦到输入框
          setTimeout(() => {
            const textarea = document.querySelector<HTMLTextAreaElement>(
              "textarea[name='message']"
            );
            if (textarea) {
              textarea.focus();
            }
          }, 100);
        }
      };

      window.addEventListener("set-quote", handleSetQuote);
      return () => {
        window.removeEventListener("set-quote", handleSetQuote);
      };
    }, [enableQuote]);

    const handleClearQuote = useCallback(() => {
      setQuoteState("");
      setQuotePath(undefined);
    }, []);

    // 处理提交，将文件信息和引用内容附加到消息中
    const handleSubmit = useCallback(
      (message: PromptInputMessage) => {
        let text = message.text || "";

        // 如果有引用内容，将其添加到消息前面
        if (enableQuote && quote) {
          const header = quotePath
            ? `[QUOTE_START=${quotePath}]`
            : "[QUOTE_START]";

          text = `${header}\n${quote}\n[QUOTE_END]\n\n${text}`;
          setQuoteState("");
          setQuotePath(undefined);
        }

        // 调用 onSubmit（不等待）
        onSubmit({
          ...message,
          text,
        });

        // 立即返回 resolved Promise，让表单立即清空
        return Promise.resolve();
      },
      [quote, enableQuote, onSubmit, quotePath]
    );

    const isDisabled =
      status !== "ready" && status !== "streaming" && status !== "submitted";
    const isStreaming = status === "streaming" || status === "submitted";

    return (
      <PromptInputProvider>
        <PromptInput
          accept={accept}
          multiple
          onError={(error) => console.error("附件处理错误:", error)}
          onSubmit={handleSubmit}
          className={cn(
            "w-full [&>div]:p-2 [&>div]:border-0 [&>div]:shadow-none [&>div]:bg-muted-foreground/10 [&>div]:ring-0 [&>div]:ring-offset-0 [&>div]:outline-none [&>div]:rounded-3xl [&>div]:hover:bg-muted-foreground/30 [&>div]:focus-within:bg-muted-foreground/30 [&>div]:focus-within:ring-0 [&>div]:focus-within:outline-none [&>div]:transition-colors [&>div]:items-start **:focus:ring-0 **:focus-visible:ring-0 **:focus:outline-none **:focus-visible:outline-none",
            className
          )}
        >
          {/* 引用内容显示 */}
          {enableQuote && quote && (
            <div className="relative rounded-full bg-muted-foreground text-muted p-2 animate-in slide-in-from-bottom-2 w-full self-start flex items-center">
              <div className="flex-1 text-sm text-muted/80 pl-2 pr-6 max-h-24 overflow-y-auto whitespace-nowrap truncate">
                {quote.length > 40 ? quote.slice(0, 40) + "..." : quote}
              </div>
              <Button
                onClick={handleClearQuote}
                className="h-5 w-5 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                size={"icon"}
                variant={"ghost"}
                aria-label="清除引用"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          <PromptInputAttachments>
            {(attachment) => (
              <PromptInputAttachment data={attachment} key={attachment.id} />
            )}
          </PromptInputAttachments>

          <PromptInputTextarea
            placeholder={placeholder}
            className={cn(
              "bg-transparent placeholder:text-muted-foreground/60 text-sm min-h-12 p-3 self-stretch focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
              quote ? "py-1" : "py-3",
              inputClassName
            )}
            autoFocus={autoFocus}
            onFocus={onFocus}
            onBlur={onBlur}
          />

          <PromptInputToolbar className="pb-0 px-0 self-end">
            <PromptInputTools>{toolbarChildren}</PromptInputTools>

            {isStreaming && onStop ? (
              <Button
                type="button"
                onClick={onStop}
                size="icon"
                className="h-8 w-8 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/40"
                variant={"secondary"}
                title="停止生成"
              >
                <Square className="h-4 w-4 stroke-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isDisabled}
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <ArrowUp className="h-4 w-4 stroke-3" />
              </Button>
            )}
          </PromptInputToolbar>
        </PromptInput>
      </PromptInputProvider>
    );
  }
);

// 设置 displayName 以便在 React DevTools 中显示
ChatInput.displayName = "ChatInput";

// 导出类型供其他组件使用
export type { ChatInputProps };
