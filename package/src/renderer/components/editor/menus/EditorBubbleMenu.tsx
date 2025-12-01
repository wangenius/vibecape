/**
 * Editor Bubble Menu 组件
 * 选中文本时弹出的格式化工具栏
 */

import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, Strikethrough, Code, Highlighter, Link, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";

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
        "p-1.5 rounded hover:bg-accent transition-colors",
        active && "bg-accent text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
};

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { state } = editor;
      const { selection } = state;
      const { from, to, empty } = selection;

      // 如果没有选中文本，隐藏菜单
      if (empty) {
        setVisible(false);
        return;
      }

      // 获取选中的文本内容，检查是否只有空白字符
      const selectedText = state.doc.textBetween(from, to, "\n");
      if (!selectedText.trim()) {
        setVisible(false);
        return;
      }

      // 获取选中文本的位置
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);

      // 计算菜单位置
      const menuWidth = menuRef.current?.offsetWidth || 0;
      const menuHeight = menuRef.current?.offsetHeight || 0;

      const left = (start.left + end.left) / 2 - menuWidth / 2;
      const top = start.top - menuHeight - 8;

      setPosition({ top, left });
      setVisible(true);
    };

    // 监听选择变化
    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("输入链接地址", previousUrl);
    
    if (url === null) return;
    
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor || !visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-popover border border-border rounded-md shadow-lg z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-1 flex gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={<Bold className="w-4 h-4" />}
          title="加粗"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={<Italic className="w-4 h-4" />}
          title="斜体"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          icon={<Underline className="w-4 h-4" />}
          title="下划线"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          icon={<Strikethrough className="w-4 h-4" />}
          title="删除线"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={<Code className="w-4 h-4" />}
          title="行内代码"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          icon={<Highlighter className="w-4 h-4" />}
          title="高亮"
        />
        <ToolbarButton
          onClick={handleLink}
          active={editor.isActive("link")}
          icon={<Link className="w-4 h-4" />}
          title="链接"
        />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          onClick={() => {
            editor.commands.insertAIPolish();
            setVisible(false);
          }}
          icon={<Sparkles className="w-4 h-4" />}
          title="AI 润色"
        />
      </div>
    </div>
  );
};

