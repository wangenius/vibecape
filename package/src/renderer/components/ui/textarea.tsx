import { cn } from "@/lib/utils";
import { EditorContent, useEditor } from "@tiptap/react";
import { useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export const Textarea = ({
  value,
  onChange,
  placeholder,
  hasError,
  autoFocus,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoFocus?: boolean;
}) => {
  const isInitialMount = useRef(true);

  const editor = useEditor({
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "输入内容...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content:
      value
        ?.split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("") || "",
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      onChange?.(e.getText({ blockSeparator: "\n" }));
    },
  });

  return (
    <div
      className={cn(
        "w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background transition-colors",
        "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-16",
        "[&_.ProseMirror_p]:m-0",
        "[&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-muted-foreground/50 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:pointer-events-none",
        hasError && "border-destructive"
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

export default Textarea;
