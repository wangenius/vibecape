import { useCallback, useEffect, useRef, useMemo } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { SlashCommand } from "@/components/editor/extensions/SlashCommand";
import { createSlashMenuPlugin } from "@/components/editor/menus/SlashMenu";
import { EditorBubbleMenu } from "@/components/editor/menus/EditorBubbleMenu";
import {
  AIRewriteNode,
  AIPolishMark,
} from "@/components/editor/extensions/AIRewriteNode";
import { CodeBlockNode } from "@/components/editor/extensions/CodeBlockNode";
import { PolishManager } from "@/components/editor/PolishManager";
import { CustomKeyboardExtension } from "@/components/editor/extensions/CustomKeyboardExtension";

type Props = {
  doc: DocData;
  onChange?: (content: JSONContent) => void;
  onSave?: (content: JSONContent) => void;
};

export const DocEditor = ({ doc, onChange, onSave }: Props) => {
  // 用 ref 存储 save 函数，解决循环引用问题
  const handleSaveRef = useRef<() => void>(() => {});

  // 创建 Slash Menu 配置
  const slashMenuConfig = useMemo(() => createSlashMenuPlugin(), []);

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: false,
        codeBlock: false, // 禁用默认 codeBlock，使用自定义的
      }),
      CodeBlockNode,
      Placeholder.configure({
        placeholder: "输入 / 打开命令菜单...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      AIRewriteNode,
      AIPolishMark,
      SlashCommand.configure({
        suggestion: slashMenuConfig,
      }),
      CustomKeyboardExtension,
      Extension.create({
        name: "saveKeymap",
        addKeyboardShortcuts() {
          return {
            "Mod-s": () => {
              handleSaveRef.current();
              return true;
            },
          };
        },
      }),
    ],
    content: doc.content,
    editorProps: {
      attributes: {
        class:
          "text-base overflow-x-hidden focus:outline-none prose prose-sm dark:prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // 仅当切换文档时更新编辑器内容
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editor && doc.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      editor.commands.setContent(doc.content);
    }
  }, [doc.id, editor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    onSave?.(content);
  }, [editor, onSave]);

  // 更新 ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  return (
    <div className="flex-1 min-h-0">
      <EditorContent
        editor={editor}
        className="w-full h-full [&_p]:mb-2 [&_.ProseMirror]:min-h-[400px]"
      />
      <EditorBubbleMenu editor={editor} />
      <PolishManager editor={editor} />
    </div>
  );
};
