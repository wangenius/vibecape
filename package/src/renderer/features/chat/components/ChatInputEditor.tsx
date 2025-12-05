import { useState, useRef, useCallback, useEffect } from "react";
import { TbSquareRoundedX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { StopIcon } from "@radix-ui/react-icons";
import { ArrowUp } from "lucide-react";
import { Mention } from "@/features/editor/extensions/Mention";
import { useTranslation } from "react-i18next";
import "@/@styles/chatinput.css";

export interface ChatInputProps {
  onSubmit: (message: { text: string }) => void | Promise<void>;
  status: "ready" | "loading" | "error" | "streaming" | "submitted";
  onStop?: () => void;
  placeholder?: string;
  enableQuote?: boolean;
}

export const ChatInputEditor = ({
  onSubmit,
  status,
  placeholder,
  onStop,
  enableQuote,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const [quote, setQuote] = useState("");
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
        Mention,
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


  return (
    <div className="chat-input-wrapper">
      {enableQuote && quote && (
        <div className="chat-input-quote">
          <div className="chat-input-quote-text">{quote}</div>
          <Button
            onClick={() => setQuote("")}
            className="chat-input-quote-close"
            size="icon"
            variant="ghost"
          >
            <TbSquareRoundedX className="h-4 w-4" />
          </Button>
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
