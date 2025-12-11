import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, Text } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";
import { DocEditor } from "@/lib/editor";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { TitleInput } from "@/layouts/mainview/TitleInput";
import { Button } from "@/components/ui/button";

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
  const { t } = useTranslation();
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

  // 仅当切换文档时或外部更新时同步状态
  const prevDocIdRef = useRef<string | null>(null);
  const prevDocTitleRef = useRef<string | null>(null);
  const prevDocDescRef = useRef<string | null>(null);

  useEffect(() => {
    const currentDesc = doc.metadata?.description ?? "";

    // 切换文档时完全重置
    if (doc.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      prevDocTitleRef.current = doc.title;
      prevDocDescRef.current = currentDesc;
      setTitle(doc.title);
      setDescription(currentDesc);
      editorContentRef.current = null;
      return;
    }

    // 同一文档但数据变化（外部更新，如 AI 重命名）
    // 只有当用户没有主动修改时才同步
    if (doc.title !== prevDocTitleRef.current) {
      // 如果当前 title 等于之前记录的外部值，说明用户没有修改，可以更新
      if (title === prevDocTitleRef.current) {
        setTitle(doc.title);
      }
      prevDocTitleRef.current = doc.title;
    }

    if (currentDesc !== prevDocDescRef.current) {
      if (description === prevDocDescRef.current) {
        setDescription(currentDesc);
      }
      prevDocDescRef.current = currentDesc;
    }
  }, [doc.id, doc.title, doc.metadata?.description, title, description]);

  // 保存函数 - 接受显式 docId 以防止竞态条件
  const createSaveHandler = useCallback(
    (docIdToSave: string) => async () => {
      try {
        await onSave(docIdToSave, {
          title,
          content: editorContentRef.current ?? doc.content,
          metadata: { ...doc.metadata, description },
        });
      } catch (error) {
        console.error("保存失败:", error);
      }
    },
    [description, title, onSave, doc.content, doc.metadata]
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
  }, [title, description, contentVersion, createSaveHandler, doc.id]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-lg">
          {/* 标题行 */}
          <div className="flex items-center gap-sm">
            <div className="flex-1">
              <TitleInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => setDescExpanded(!descExpanded)}
              size="icon"
              title={
                descExpanded
                  ? t("common.settings.collapseDesc")
                  : t("common.settings.expandDesc")
              }
            >
              {descExpanded ? <ChevronUp /> : <Text />}
            </Button>
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
                <div className="bg-muted rounded-lg">
                  <Textarea
                    value={description}
                    onChange={(value) => {
                      setDescription(value);
                    }}
                    placeholder={t("common.settings.enterDesc")}
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
  );
};
