import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { DocEditor } from "@/lib/editor";
import { getTitleFromDocument } from "@/lib/editor/extensions/TitleNode";

type Props = {
  doc: DocData;
  onSave: (
    docId: string,
    data: {
      title?: string;
      content?: JSONContent;
      metadata?: Record<string, any>;
    }
  ) => Promise<void>;
};

export const DocRepository = ({ doc, onSave }: Props) => {
  const [description, setDescription] = useState(
    doc.metadata?.description ?? ""
  );

  // 用于存储编辑器内容的 ref
  const editorContentRef = useRef<JSONContent | null>(null);

  // 自动保存相关
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastDocIdRef = useRef<string | null>(null);
  const [contentVersion, setContentVersion] = useState(0);

  // 仅当切换文档时或外部更新时同步状态
  const prevDocIdRef = useRef<string | null>(null);
  const prevDocDescRef = useRef<string | null>(null);

  useEffect(() => {
    const currentDesc = doc.metadata?.description ?? "";

    // 切换文档时完全重置
    if (doc.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      prevDocDescRef.current = currentDesc;
      setDescription(currentDesc);
      editorContentRef.current = null;
      return;
    }

    // 同一文档但描述变化（外部更新）
    if (currentDesc !== prevDocDescRef.current) {
      if (description === prevDocDescRef.current) {
        setDescription(currentDesc);
      }
      prevDocDescRef.current = currentDesc;
    }
  }, [doc.id, doc.metadata?.description, description]);

  // 保存函数 - 从编辑器内容中提取标题
  const createSaveHandler = useCallback(
    (docIdToSave: string) => async () => {
      try {
        const content = editorContentRef.current ?? doc.content;
        // 从编辑器内容中提取标题
        const title = getTitleFromDocument(content);

        await onSave(docIdToSave, {
          title, // 直接使用提取到的标题，包括空字符串
          content,
          metadata: { ...doc.metadata, description },
        });
      } catch (error) {
        console.error("保存失败:", error);
      }
    },
    [description, onSave, doc.content, doc.metadata, doc.title]
  );

  // 编辑器内容变化回调
  const handleEditorChange = useCallback((content: JSONContent) => {
    editorContentRef.current = content;
    setContentVersion((v) => v + 1);
  }, []);

  // 编辑器保存回调
  const handleEditorSave = useCallback((content: JSONContent) => {
    editorContentRef.current = content;
    setContentVersion((v) => v + 1);
  }, []);

  // 重置初始化状态当切换文档时，并清除待处理的保存定时器
  useEffect(() => {
    if (doc.id !== lastDocIdRef.current) {
      // 清除任何待处理的保存定时器（防止旧文档的保存操作）
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      isInitializedRef.current = false;
      lastDocIdRef.current = doc.id;
    }
  }, [doc.id]);

  // 触发自动保存 - 在设置定时器时捕获当前 doc.id
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 在设置定时器时捕获 doc.id，而不是在定时器触发时
    const docIdToSave = doc.id;
    autoSaveTimerRef.current = setTimeout(() => {
      createSaveHandler(docIdToSave)();
    }, 300);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [description, contentVersion, createSaveHandler, doc.id]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-3xl mx-auto w-full">
        {/* 编辑器 - 标题现在嵌入在编辑器内部 */}
        <DocEditor
          doc={doc}
          onChange={handleEditorChange}
          onSave={handleEditorSave}
        />
      </div>
    </div>
  );
};
