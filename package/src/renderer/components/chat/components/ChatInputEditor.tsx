import { useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { StopIcon } from "@radix-ui/react-icons";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  RefExtension,
  refContentToText,
  insertTextRef,
} from "../extensions/RefExtension";
import {
  addQuoteListener,
  type QuoteEventDetail,
} from "@/lib/events/quoteEvent";
// Styles are imported via chat/index.ts

export interface ChatInputProps {
  onSubmit: (message: { text: string }) => void | Promise<void>;
  status: "ready" | "loading" | "error" | "streaming" | "submitted";
  onStop?: () => void;
  placeholder?: string;
  enableQuote?: boolean;
  /** 队列中等待处理的消息数 */
  queueLength?: number;
}

export const ChatInputEditor = ({
  onSubmit,
  status,
  placeholder,
  onStop,
  enableQuote = true,
  queueLength = 0,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const isStreaming = status === "streaming" || status === "submitted";
  const handleSubmitRef = useRef<() => void>(() => {});
  const placeholderText = placeholder || t("chat.input.placeholder");

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
        }),
        Placeholder.configure({
          placeholder: placeholderText,
          emptyEditorClass: "is-editor-empty",
        }),
        // 使用 RefExtension 替代 Mention
        ...RefExtension,
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
          class: "chat-input-editor",
          "data-chat-input": "true",
        },
      },
    },
    [placeholderText]
  );

  /**
   * 将编辑器内容转换为消息文本
   * 使用 refContentToText 处理 docRef 和 textRef 节点
   */
  const getMessageText = useCallback((): string => {
    if (!editor) return "";
    const json = editor.getJSON();
    return refContentToText(json);
  }, [editor]);

  const handleSubmit = useCallback(() => {
    if (!editor || editor.isEmpty) return;

    const text = getMessageText();
    if (!text.trim()) return;

    onSubmit({ text });
    editor.commands.clearContent();
  }, [editor, onSubmit, getMessageText]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // 监听引用事件 - 当用户按 Cmd+L 或点击引用按钮时
  useEffect(() => {
    if (!enableQuote || !editor) return;

    const removeListener = addQuoteListener((detail: QuoteEventDetail) => {
      // 使用 textRef 节点插入引用，传递完整信息
      insertTextRef(editor, {
        text: detail.text,
        docId: detail.docId,
        docTitle: detail.docTitle,
        position: detail.position,
        context: detail.context,
        paragraph: detail.paragraph,
        paragraphOffset: detail.paragraphOffset,
      });
      editor.commands.focus("end");
    });

    return removeListener;
  }, [enableQuote, editor]);

  return (
    <div className="chat-input-wrapper">
      {/* 队列状态提示 */}
      {queueLength > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>{t("chat.input.queuePending", { count: queueLength })}</span>
        </div>
      )}
      <div className="chat-input-container">
        <EditorContent editor={editor} />
        <div className="chat-input-actions">
          {isStreaming && onStop ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="chat-input-stop-btn"
              variant="secondary"
              title={t("chat.input.stopGeneration")}
            >
              <StopIcon className="h-4 w-4 stroke-3" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isStreaming || editor?.isEmpty}
              size="icon"
              className="chat-input-submit-btn"
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
