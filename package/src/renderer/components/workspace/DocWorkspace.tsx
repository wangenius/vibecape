import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, Text } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TitleInput } from "@/components/editor/TitleInput";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { DocEditor } from "@/components/editor/DocEditor";
import AutoResizeTextarea from "../ui/AutoResizeTextarea";

type Props = {
  doc: DocData;
  onSave: (data: {
    title?: string;
    content?: JSONContent;
    metadata?: Record<string, any>;
  }) => Promise<void>;
};

export const DocWorkspace = ({ doc, onSave }: Props) => {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(
    doc.metadata?.description ?? ""
  );
  const [descExpanded, setDescExpanded] = useState(false);

  // 用于存储编辑器内容的 ref
  const editorContentRef = useRef<JSONContent | null>(null);

  // 自动保存相关
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastDocIdRef = useRef<string | null>(null);
  const [contentVersion, setContentVersion] = useState(0);

  // 仅当切换文档时更新状态
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (doc.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      setTitle(doc.title);
      setDescription(doc.metadata?.description ?? "");
      editorContentRef.current = null;
    }
  }, [doc.id]);

  // 保存函数
  const handleSave = useCallback(async () => {
    try {
      await onSave({
        title,
        content: editorContentRef.current ?? doc.content,
        metadata: { ...doc.metadata, description },
      });
    } catch (error) {
      console.error("保存失败:", error);
    }
  }, [description, title, onSave, doc.content, doc.metadata]);

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

  // 重置初始化状态当切换文档时
  useEffect(() => {
    if (doc.id !== lastDocIdRef.current) {
      isInitializedRef.current = false;
      lastDocIdRef.current = doc.id;
    }
  }, [doc.id]);

  // 触发自动保存
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 300);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, description, contentVersion, handleSave]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <div className="mb-6">
            {/* 标题行 */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TitleInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={descExpanded ? "收起描述" : "展开描述"}
              >
                {descExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <Text className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* 描述 */}
            <AnimatePresence>
              {descExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 bg-muted rounded-lg">
                    <AutoResizeTextarea
                      value={description}
                      onValueChange={(value) => {
                        setDescription(value);
                      }}
                      placeholder="输入描述..."
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 编辑器 */}
          <DocEditor
            doc={doc}
            onChange={handleEditorChange}
            onSave={handleEditorSave}
          />
        </div>
      </div>
    </div>
  );
};
