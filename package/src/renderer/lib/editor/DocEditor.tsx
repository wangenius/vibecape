import { useCallback, useRef } from "react";
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

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions,
    content: doc.content,
    editorProps: editorPropsConfig,
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      onChange?.(content);
    },
  });

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
