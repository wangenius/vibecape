/**
 * Editor Bubble Menu 组件
 * 使用 Tiptap 官方 BubbleMenu 扩展
 */

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Code, Link, Sparkles } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  icon,
  title,
}: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-lg",
        "transition-all duration-100 hover:bg-muted",
        active && "text-primary bg-primary/10",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
};

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const { t } = useTranslation();
  const handleLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(t("common.bubbleMenu.enterLinkUrl"), previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor, state }) => {
        const { from, to, empty } = state.selection;
        if (empty) return false;

        // 检查是否有非空白文本
        const text = state.doc.textBetween(from, to, "\n");
        if (!text.trim()) return false;

        // 不在代码块中显示
        if (editor.isActive("codeBlock")) return false;

        return true;
      }}
    >
      <div className="flex items-center gap-0.5 p-1 rounded-lg border border-muted-foreground/20 bg-background">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={<Bold className="size-4" strokeWidth={2} />}
          title={t("common.bubbleMenu.bold")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={<Italic className="size-4" strokeWidth={2} />}
          title={t("common.bubbleMenu.italic")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={<Code className="size-4" strokeWidth={2} />}
          title={t("common.bubbleMenu.code")}
        />
        <ToolbarButton
          onClick={handleLink}
          active={editor.isActive("link")}
          icon={<Link className="size-4" strokeWidth={2} />}
          title={t("common.bubbleMenu.link")}
        />
        <div className="w-px h-4 bg-zinc-700 mx-0.5" />
        <ToolbarButton
          onClick={() => editor.commands.insertAIPolish()}
          icon={<Sparkles className="size-4" strokeWidth={2} />}
          title={t("common.bubbleMenu.ai")}
        />
      </div>
    </BubbleMenu>
  );
};
