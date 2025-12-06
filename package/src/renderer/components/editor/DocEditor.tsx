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
import { AIDiffMark } from "@/components/editor/extensions/AIDiffMark";
import { AIDiffNode } from "@/components/editor/extensions/AIDiffNode";
import { CodeBlockNode } from "@/components/editor/extensions/CodeBlockNode";
import { InlineCode } from "@/components/editor/extensions/InlineCode";
import { Blockquote } from "@/components/editor/extensions/Blockquote";
import { Admonition } from "@/components/editor/extensions/Admonition";
import { Mention } from "@/components/editor/extensions/Mention";
import { ImageNode } from "@/components/editor/extensions/ImageNode";
import { LinkNode } from "@/components/editor/extensions/LinkNode";
import { PolishManager } from "@/components/editor/PolishManager";
import { CustomKeyboardExtension } from "@/components/editor/extensions/CustomKeyboardExtension";
import { useTranslation } from "react-i18next";
import { useRemoteTools } from "@/hooks/editor/useRemoteTools";

type Props = {
  doc: DocData;
  onChange?: (content: JSONContent) => void;
  onSave?: (content: JSONContent) => void;
};

export const DocEditor = ({ doc, onChange, onSave }: Props) => {
  const { t } = useTranslation();
  // 用 ref 存储 save 函数，解决循环引用问题
  const handleSaveRef = useRef<() => void>(() => {});
  const containerRef = useRef<HTMLDivElement>(null);

  // 创建 Slash Menu 配置
  const slashMenuConfig = useMemo(() => createSlashMenuPlugin(t), [t]);

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: false,
        codeBlock: false, // 禁用默认 codeBlock，使用自定义的
        code: false, // 禁用默认 inline code，使用自定义的
        blockquote: false, // 禁用默认 blockquote，使用自定义的
      }),
      CodeBlockNode,
      InlineCode,
      Blockquote,
      Admonition,
      Mention,
      ImageNode,
      LinkNode,
      Placeholder.configure({
        placeholder: t("common.settings.slashPlaceholder"),
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
      AIDiffMark,
      AIDiffNode,
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
      Extension.create({
        name: "quoteKeymap",
        addKeyboardShortcuts() {
          return {
            "Mod-l": ({ editor }) => {
              const { from, to, empty } = editor.state.selection;
              if (empty) return false;

              const doc = editor.state.doc;
              const text = doc.textBetween(from, to, "\n");
              if (!text.trim()) return false;

              // 获取上下文
              const contextBefore = doc.textBetween(
                Math.max(0, from - 200),
                from,
                "\n"
              );
              const contextAfter = doc.textBetween(
                to,
                Math.min(doc.content.size, to + 200),
                "\n"
              );

              // 找到选区所在的段落
              let paragraph = "";
              let paragraphOffset = 0;
              doc.nodesBetween(from, to, (node, pos) => {
                if (
                  node.type.name === "paragraph" ||
                  node.type.name === "heading"
                ) {
                  paragraph = node.textContent;
                  paragraphOffset = from - pos - 1;
                  return false;
                }
                return true;
              });

              // 动态导入避免循环依赖
              import("@/lib/events/quoteEvent").then(
                ({ dispatchQuoteEvent }) => {
                  import("@/hooks/stores/useDocumentStore").then(
                    ({ useDocumentStore }) => {
                      const activeDoc = useDocumentStore.getState().activeDoc;
                      dispatchQuoteEvent({
                        text: text.trim(),
                        docId: activeDoc?.id,
                        docTitle: activeDoc?.title,
                        position: { from, to },
                        context: {
                          before: contextBefore,
                          after: contextAfter,
                        },
                        paragraph: paragraph || undefined,
                        paragraphOffset: paragraph
                          ? paragraphOffset
                          : undefined,
                      });
                    }
                  );
                }
              );

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

  // 启用远程工具控制
  useRemoteTools(editor);

  // 当切换文档或文档内容外部更新时同步编辑器
  const prevDocIdRef = useRef<string | null>(null);
  const prevContentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;

    const currentContentStr = JSON.stringify(doc.content);
    const isDocSwitch = doc.id !== prevDocIdRef.current;
    const isExternalUpdate = currentContentStr !== prevContentRef.current;

    // 切换文档时直接更新
    if (isDocSwitch) {
      prevDocIdRef.current = doc.id;
      prevContentRef.current = currentContentStr;
      editor.commands.setContent(doc.content);
      return;
    }

    // 同一文档但内容变化（外部更新，如 AI 工具修改）
    // 只有当编辑器内容与新内容不同时才更新，避免干扰用户输入
    if (isExternalUpdate) {
      const editorContentStr = JSON.stringify(editor.getJSON());
      if (editorContentStr !== currentContentStr) {
        prevContentRef.current = currentContentStr;
        editor.commands.setContent(doc.content);
      }
    }
  }, [doc.id, doc.content, editor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    onSave?.(content);
  }, [editor, onSave]);

  // 更新 ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 点击底部空白区域时聚焦到编辑器末尾
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      // 只处理点击容器本身（底部 padding 区域）
      if (e.target === containerRef.current) {
        editor.commands.focus("end");
      }
    },
    [editor]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 pb-[80vh] cursor-text flex flex-col w-full"
      onClick={handleContainerClick}
    >
      <div className="flex-1">
        <EditorContent
          editor={editor}
          className="w-full h-full [&_p]:mb-2 [&_.ProseMirror]:min-h-[400px]"
        />
      </div>
      <EditorBubbleMenu editor={editor} />
      <PolishManager editor={editor} />
    </div>
  );
};
