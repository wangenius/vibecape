import { useCallback, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { EditorBubbleMenu } from "./menus/EditorBubbleMenu";
import { TableBubbleMenu } from "./menus/TableBubbleMenu";
import { useTranslation } from "react-i18next";
import {
  useDocEditorExtensions,
  useDocEditorSync,
  editorPropsConfig,
} from "./hooks";
import { createDocumentWithTitle } from "./extensions/TitleNode";

type Props = {
  doc: DocData;
  onChange?: (content: JSONContent) => void;
  onSave?: (content: JSONContent) => void;
};

export const DocEditor = ({ doc, onChange, onSave }: Props) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // 同步逻辑 hook（必须在 useEditor 之前调用以获取 handleSaveRef）
  const handleSaveRef = useRef<() => void>(() => {});

  // 获取编辑器扩展配置
  const extensions = useDocEditorExtensions({ t, handleSaveRef });

  // 准备编辑器内容 - 确保包含 title 节点
  const initialContent = useMemo(() => {
    // 检查文档内容是否已经包含 title 节点
    const content = doc.content as JSONContent | undefined;
    if (
      content?.type === "doc" &&
      Array.isArray(content.content) &&
      content.content[0]?.type === "title"
    ) {
      // 已经有 title 节点，直接使用
      return content;
    }

    // 创建包含 title 的文档结构
    // 如果 content 是 doc 类型，使用其 content 数组
    const bodyContent =
      content?.type === "doc" ? (content.content as JSONContent[]) : undefined;
    return createDocumentWithTitle(doc.title, bodyContent);
  }, [doc.id]); // 只在文档 ID 变化时重新计算

  // 创建 Tiptap 编辑器
  const editor = useEditor(
    {
      extensions,
      content: initialContent,
      editorProps: editorPropsConfig,
      onUpdate: ({ editor }) => {
        const content = editor.getJSON();
        onChange?.(content);
      },
    },
    [doc.id] // 当文档 ID 变化时重新创建编辑器
  );

  // 文档同步、远程工具、快捷键等
  useDocEditorSync({ editor, doc, onSave });

  // 点击底部空白区域时聚焦到编辑器末尾
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      if (e.target === containerRef.current) {
        editor.commands.focus("end");
      }
    },
    [editor]
  );

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 pb-[80vh] cursor-text flex flex-col w-full"
      onClick={handleContainerClick}
    >
      <div className="flex-1">
        <EditorContent
          editor={editor}
          className="w-full h-full [&_p]:mb-2 [&_.ProseMirror]:min-h-[400px]"
        />
      </div>
      <EditorBubbleMenu editor={editor} />
      <TableBubbleMenu editor={editor} containerRef={containerRef} />
    </div>
  );
};
