/**
 * Editor Bubble Menu 组件
 * 选中文本时弹出的工具栏：引用和润色
 */

import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Quote, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { openBayBar } from "@/hook/app/useViewManager";

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
        "p-2 rounded hover:bg-accent transition-colors",
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

  // 处理引用按钮
  const handleQuote = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { from, to } = state.selection;
    const selectedText = state.doc.textBetween(from, to, "\n");

    // 打开 BayBar
    openBayBar();

    // 延迟一下，等待 BayBar 动画完成后再设置引用
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        "textarea[name='message']"
      );
      if (textarea) {
        // 通过 ChatInput 的 ref 来设置引用
        const chatInputElement = textarea.closest('[data-chat-input]');
        if (chatInputElement) {
          // 触发自定义事件来设置引用
          const event = new CustomEvent("set-quote", {
            detail: { text: selectedText }
          });
          window.dispatchEvent(event);
        }
      }
    }, 350);

    // 清除选择
    editor.commands.blur();
  }, [editor]);

  // 处理润色按钮 - 插入 AI 润色节点
  const handlePolish = useCallback(() => {
    if (!editor) return;

    // 插入 AI 润色节点（会自动给选中文字添加 mark）
    editor.commands.insertAIPolish();
    
    // 隐藏菜单
    setVisible(false);
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
      <div className="p-1 flex gap-1">
        <ToolbarButton
          onClick={handleQuote}
          icon={<Quote className="w-4 h-4" />}
          title="引用到对话"
        />
        <ToolbarButton
          onClick={handlePolish}
          icon={<Sparkles className="w-4 h-4" />}
          title="润色"
        />
      </div>
    </div>
  );
};

