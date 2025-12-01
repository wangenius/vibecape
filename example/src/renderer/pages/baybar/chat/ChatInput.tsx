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
import {
  FileUploadButton,
  UploadedFile,
} from "@/components/custom/FileUploadButton";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileTextIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StopIcon } from "@radix-ui/react-icons";

const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx";

// 对外暴露的方法接口
export interface ChatInputRef {
  setQuote: (text: string) => void;
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
      showFileUpload = true,
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
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [quote, setQuoteState] = useState<string>("");

    // 对外暴露方法
    useImperativeHandle(
      ref,
      () => ({
        setQuote: (text: string) => {
          setQuoteState(text);
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
        const customEvent = event as CustomEvent<{ text: string }>;
        if (customEvent.detail?.text && enableQuote) {
          setQuoteState(customEvent.detail.text);
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

    const handleFilesUploaded = useCallback((files: UploadedFile[]) => {
      console.log(files);

      setFiles((prev) => [...prev, ...files]);
    }, []);

    const onRemoveFile = useCallback((index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleClearQuote = useCallback(() => {
      setQuoteState("");
    }, []);

    // 处理提交，将文件信息和引用内容附加到消息中
    const handleSubmit = useCallback(
      (message: PromptInputMessage) => {
        let text = message.text || "";

        // 如果有引用内容，将其添加到消息前面
        if (enableQuote && quote) {
          text = `[QUOTE_START]\n${quote}\n[QUOTE_END]\n\n${text}`;
          setQuoteState("");
        }

        // 如果有上传的文件，将文件引用添加到消息中
        if (files.length > 0) {
          const fileReferences = files
            .map((f) => `[FILE]${f.url}|${f.name}[/FILE]`)
            .join("\n");
          text = text ? `${fileReferences}\n\n${text}` : fileReferences;
          setFiles([]);
        }

        // 调用 onSubmit（不等待）
        onSubmit({
          ...message,
          text,
        });

        // 立即返回 resolved Promise，让表单立即清空
        return Promise.resolve();
      },
      [files, quote, enableQuote, onSubmit]
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
            "w-full [&>div]:p-2 [&>div]:border-0 [&>div]:shadow-none [&>div]:bg-muted-foreground/10 [&>div]:ring-0 [&>div]:ring-offset-0 [&>div]:outline-none [&>div]:rounded-2xl [&>div]:hover:bg-muted-foreground/30 [&>div]:focus-within:bg-muted-foreground/30 [&>div]:focus-within:ring-0 [&>div]:focus-within:outline-none [&>div]:transition-colors [&>div]:items-start **:focus:ring-0 **:focus-visible:ring-0 **:focus:outline-none **:focus-visible:outline-none",
            className
          )}
        >
          {/* 引用内容显示 */}
          {enableQuote && quote && (
            <div className="mb-2 relative rounded-2xl bg-muted-foreground/10 p-3 animate-in slide-in-from-bottom-2 w-full self-start">
              <Button
                onClick={handleClearQuote}
                className="absolute top-2 right-2 h-5 w-5 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                size={"icon"}
                variant={"ghost"}
                aria-label="清除引用"
              >
                <XIcon className="h-4 w-4" />
              </Button>

              <div className="text-sm text-foreground/50 pr-6 max-h-24 overflow-y-auto">
                {quote.length > 80 ? quote.slice(0, 80) + "..." : quote}
              </div>
            </div>
          )}

          {/* 已上传文件预览 */}
          {files.length > 0 && (
            <div className="space-y-2 w-full self-start">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full text-sm group hover:bg-primary/20 transition-colors"
                  >
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground max-w-[200px] truncate">
                      {file.name}
                    </span>
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="移除文件"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
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
              files.length > 0 ? "py-1" : "py-3",
              inputClassName
            )}
            autoFocus={autoFocus}
            onFocus={onFocus}
            onBlur={onBlur}
          />

          <PromptInputToolbar className="pb-0 px-0 self-end">
            <PromptInputTools>
              {showFileUpload && (
                <FileUploadButton
                  onFilesUploaded={handleFilesUploaded}
                  disabled={isDisabled}
                />
              )}
              {toolbarChildren}
            </PromptInputTools>

            {isStreaming && onStop ? (
              <Button
                type="button"
                onClick={onStop}
                size="icon"
                className="h-8 w-8 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/40"
                variant={"secondary"}
                title="停止生成"
              >
                <StopIcon className="h-4 w-4 stroke-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isDisabled}
                size="icon"
                className="h-8 w-8 rounded-full"
                variant={"primary"}
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
export type { ChatInputProps, UploadedFile };
