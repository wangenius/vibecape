/**
 * Tiptap 编辑器组件
 * 替代原有的 SlateEditor
 */

import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";
import { createLLM } from "@/lib/llm";
import { useSettings } from "@/hook/app/useSettings";
import { getPredictText, PredictNode } from "./extensions/PredictNode";
import { DEFAULT_TIPTAP_CONTENT, TiptapContent } from "./tiptap-types";
import { SelectedContextMenu } from "@/components/editor/popover/SelectedContextMenu";
import { EditorBubbleMenu } from "./menus/EditorBubbleMenu";
import { PolishManager } from "./PolishManager";
import { createSlashMenuPlugin } from "./menus/SlashMenu";
import { SlashCommand } from "./extensions/SlashCommand";
import { createMentionPlugin } from "./menus/MentionMenu";
import { MentionCommand } from "./extensions/MentionCommand";
import { MentionNode } from "./extensions/MentionNode";
import { AIRewriteNode, AIPolishMark } from "./extensions/AIRewriteNode";
import { CustomKeyboardExtension } from "./extensions/CustomKeyboardExtension";

interface TiptapEditorProps {
  value: TiptapContent;
  onChange(value: TiptapContent): void;
  readonly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  quickFocus?: boolean;
  onAIChat?: () => void;
  onAIContinue?: () => void;
}

/**
 * Tiptap 编辑器组件
 */
export const NovelChapterEditor = memo((props: TiptapEditorProps) => {
  const {
    value,
    onChange,
    readonly,
    autoFocus,
    placeholder,
    className,
    quickFocus,
    onAIChat,
    onAIContinue,
  } = props;

  const auto_infer = useSettings((select) => select.novel.autoInfer);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const refs = {
    bottom: useRef<HTMLDivElement>(null),
    root: useRef<HTMLDivElement>(null),
  };

  // 创建 Slash Menu 配置 - 使用 useMemo 避免重复创建
  const slashMenuConfig = useMemo(() => createSlashMenuPlugin(), []);

  // 创建 Mention Menu 配置 - 使用 useMemo 避免重复创建
  const mentionMenuConfig = useMemo(() => {
    return createMentionPlugin();
  }, []);

  // 创建编辑器实例 - 只在组件挂载时创建一次
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit 包含 Document, Paragraph, Text, History 等
        // 禁用软换行，每次 Enter 都创建新段落
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "输入 / 打开命令菜单...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      PredictNode,
      MentionNode,
      AIRewriteNode,
      AIPolishMark,
      SlashCommand.configure({
        suggestion: slashMenuConfig,
      }),
      MentionCommand.configure({
        suggestion: mentionMenuConfig,
      }),
      CustomKeyboardExtension,
    ],
    content: value || DEFAULT_TIPTAP_CONTENT,
    editable: !readonly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      // 直接调用 onChange，父组件负责防抖
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "text-base overflow-x-hidden h-full focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  // 只更新只读状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readonly);
    }
  }, [readonly, editor]);

  // 只读模式下滚动到底部
  useEffect(() => {
    if (readonly && refs.bottom.current) {
      refs.bottom.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [readonly]);

  // AI 自动推理功能
  const autoInfer = useCallback(async () => {
    if (!editor || !auto_infer) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      "\n"
    );

    if (!textBefore) return;

    createLLM().system(`- Role: 你是一个专业小说家。
- Goals: 请根据提示的上文，给出下文的预测，直接返回下文内容。
- Constraints：
  1. 预测输出 50 字以内。
  2. 纯文本输出，不带任何诸如 Markdown、HTML 等格式。`);
  }, [auto_infer, editor]);

  // 键盘事件处理
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!editor) return;

      // 禁止 Ctrl+W 关闭窗口
      if (event.ctrlKey && event.key.toLowerCase() === "w") {
        event.preventDefault();
      }

      // Alt+P 触发自动推理
      if (auto_infer && event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        autoInfer();
        return;
      }

      if (readonly) return;

      // Tab 键接受预测
      if (event.key === "Tab") {
        event.preventDefault();
        const text = getPredictText();
        if (text) {
          editor.commands.insertContent(text);
        }
        editor.commands.removePredict();
        return;
      }

      // 其他键删除预测
      editor.commands.removePredict();
    },
    [editor, readonly, auto_infer, autoInfer]
  );

  // 选择处理（只读模式）
  const handleSelect = useCallback(
    (event: any) => {
      if (!readonly) return;
      window.getSelection()?.removeAllRanges();
      event.preventDefault();
    },
    [readonly]
  );

  // 右键菜单处理
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const selectedText = window.getSelection()?.toString();

    setContextMenu({
      visible: selectedText ? true : false,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!refs.root.current?.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 快捷聚焦
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (quickFocus && event.ctrlKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        editor?.commands.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickFocus, editor]);

  // 监听 AI 功能事件
  useEffect(() => {
    const handleAIChat = () => {
      onAIChat?.();
    };

    const handleAIContinue = () => {
      onAIContinue?.();
    };

    window.addEventListener("tiptap:ai-chat", handleAIChat);
    window.addEventListener("tiptap:ai-continue", handleAIContinue);

    return () => {
      window.removeEventListener("tiptap:ai-chat", handleAIChat);
      window.removeEventListener("tiptap:ai-continue", handleAIContinue);
    };
  }, [onAIChat, onAIContinue]);

  const handleClick = useCallback(() => {
    if (readonly) return;
    editor?.commands.removePredict();
  }, [readonly, editor]);

  return (
    <div className={cn("flex-1", className)} ref={refs.root}>
      <div
        className="w-full h-full flex-1"
        onKeyDown={onKeyDown}
        onSelect={handleSelect}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        onMouseDown={readonly ? (e) => e.preventDefault() : undefined}
        onMouseUp={readonly ? (e) => e.preventDefault() : undefined}
      >
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="w-full h-full flex-1 [&_p]:mb-2"
        />
        {!readonly && (
          <>
            <EditorBubbleMenu editor={editor} />
            <PolishManager editor={editor} />
          </>
        )}
      </div>
      <div ref={refs.bottom} />

      {contextMenu.visible && (
        <SelectedContextMenu
          position={contextMenu.position}
          onClose={() =>
            setContextMenu((prev) => ({ ...prev, visible: false }))
          }
        />
      )}
    </div>
  );
});

NovelChapterEditor.displayName = "TiptapEditor";
