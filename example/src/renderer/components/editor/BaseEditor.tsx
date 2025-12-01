/**
 * 简化版 Tiptap 编辑器
 * 替代原有的 SimpleSlate
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DEFAULT_TIPTAP_CONTENT, TiptapContent } from "./tiptap-types";

interface SimpleTiptapProps {
  readonly?: boolean;
  defaultValue?: TiptapContent;
  onChange(value: TiptapContent): void;
  extensions?: Extension[];
  className?: string;
  placeholder?: string;
}

/**
 * 简化版 Tiptap 编辑器 - 非受控组件
 * 使用 key prop 来切换文档
 */
export const BaseEditor = memo((props: SimpleTiptapProps) => {
  const {
    readonly,
    defaultValue = DEFAULT_TIPTAP_CONTENT,
    onChange,
    className,
    placeholder,
    extensions = [StarterKit],
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);

  // 创建编辑器实例 - 只在组件挂载时创建一次
  const editor = useEditor({
    extensions,
    content: defaultValue,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      // 直接调用 onChange，父组件负责防抖
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          className ||
          "!outline-none focus:!outline-none focus-visible:!outline-none",
        "data-tiptap-simple": "true",
      },
    },
  });

  // 只更新只读状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readonly);
    }
  }, [readonly, editor]);

  // 只读模式的事件处理
  const handleSelect = useCallback(
    (event: React.SyntheticEvent) => {
      if (readonly) event.preventDefault();
    },
    [readonly]
  );

  const handleMouseEvent = useCallback(
    (event: React.MouseEvent) => {
      if (readonly) event.preventDefault();
    },
    [readonly]
  );

  return (
    <div
      ref={rootRef}
      onSelect={handleSelect}
      onMouseDown={handleMouseEvent}
      onMouseUp={handleMouseEvent}
      onClick={handleMouseEvent}
      className="**:outline-none! [&_*:focus]:outline-none! [&_*:focus-visible]:outline-none!"
    >
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
});

BaseEditor.displayName = "SimpleTiptap";
