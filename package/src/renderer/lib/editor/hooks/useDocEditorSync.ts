import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { useRemoteTools } from "@/hooks/editor/useRemoteTools";
import { useExpandRegion } from "@/hooks/shortcuts/useExpandRegion";
import { useEditorStore } from "@/hooks/stores/useEditorStore";

type UseDocEditorSyncOptions = {
  editor: Editor | null;
  doc: DocData;
  onSave?: (content: JSONContent) => void;
};

/**
 * 文档编辑器同步 Hook
 * 处理文档切换、外部更新同步、远程工具、快捷键等
 */
export const useDocEditorSync = ({
  editor,
  doc,
  onSave,
}: UseDocEditorSyncOptions) => {
  // 用于跟踪文档切换和外部更新
  const prevDocIdRef = useRef<string | null>(null);
  const prevContentRef = useRef<string | null>(null);
  const handleSaveRef = useRef<() => void>(() => {});

  // 启用远程工具控制
  useRemoteTools(editor);

  // 启用 Cmd+W 扩展选区快捷键
  useExpandRegion(editor);

  // 注册 editor 到 store，供全局快捷键等使用
  const setEditor = useEditorStore((state) => state.setEditor);
  useEffect(() => {
    setEditor(editor);
    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  // 当切换文档或文档内容外部更新时同步编辑器
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
    if (isExternalUpdate) {
      const editorContentStr = JSON.stringify(editor.getJSON());
      if (editorContentStr !== currentContentStr) {
        prevContentRef.current = currentContentStr;
        editor.commands.setContent(doc.content);
      }
    }
  }, [doc.id, doc.content, editor]);

  // 保存处理函数
  const handleSave = useCallback(() => {
    if (!editor) return;
    const content = editor.getJSON();
    onSave?.(content);
  }, [editor, onSave]);

  // 更新 ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 创建 onUpdate 回调，同步更新 prevContentRef
  const createOnUpdate = useCallback(
    (onChange?: (content: JSONContent) => void) => {
      return ({ editor }: { editor: Editor }) => {
        const content = editor.getJSON();
        prevContentRef.current = JSON.stringify(content);
        onChange?.(content);
      };
    },
    []
  );

  return {
    handleSaveRef,
    prevContentRef,
    createOnUpdate,
  };
};
