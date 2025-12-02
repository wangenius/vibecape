import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
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
import { AIRewriteNode, AIPolishMark } from "@/components/editor/extensions/AIRewriteNode";
import { CodeBlockNode } from "@/components/editor/extensions/CodeBlockNode";
import { PolishManager } from "@/components/editor/PolishManager";
import { CustomKeyboardExtension } from "@/components/editor/extensions/CustomKeyboardExtension";

type Props = {
  doc: DocData;
  onSave: (data: {
    title?: string;
    content?: JSONContent;
    metadata?: Record<string, any>;
  }) => Promise<void>;
};

export const VibecapeEditor = ({ doc, onSave }: Props) => {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(
    doc.metadata?.description ?? ""
  );
  const [metaValue, setMetaValue] = useState<Record<string, any>>(
    doc.metadata ?? {}
  );

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
  });

  // 仅当切换文档时更新编辑器内容
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editor && doc.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      editor.commands.setContent(doc.content);
      setTitle(doc.title);
      setDescription(doc.metadata?.description ?? "");
      setMetaValue(doc.metadata ?? {});
    }
  }, [doc.id, editor]);

  // 更新 description 时同步到 metaValue
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setMetaValue((prev) => ({ ...prev, description: value }));
  };

  // 更新其他元数据字段
  const handleMetaFieldChange = (key: string, value: string) => {
    setMetaValue((prev) => ({ ...prev, [key]: value }));
  };

  // 元数据折叠状态
  const [metaExpanded, setMetaExpanded] = useState(true);

  // 添加元数据字段
  const [newFieldKey, setNewFieldKey] = useState("");
  const handleAddMetaField = () => {
    const key = newFieldKey.trim();
    if (!key || key === "title" || key === "description" || metaValue[key] !== undefined) return;
    setMetaValue((prev) => ({ ...prev, [key]: "" }));
    setNewFieldKey("");
  };

  // 删除元数据字段
  const handleDeleteMetaField = (key: string) => {
    setMetaValue((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.getJSON();
      await onSave({
        title,
        content,
        metadata: { ...metaValue, description },
      });
    } catch (error) {
      console.error("保存失败:", error);
    }
  }, [editor, metaValue, description, title, onSave]);

  // 更新 ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 自动保存 (防抖 1.5 秒)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [contentVersion, setContentVersion] = useState(0);
  const isInitializedRef = useRef(false);
  const lastDocIdRef = useRef<string | null>(null);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setContentVersion((v) => v + 1);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  // 重置初始化状态当切换文档时
  useEffect(() => {
    if (doc.id !== lastDocIdRef.current) {
      isInitializedRef.current = false;
      lastDocIdRef.current = doc.id;
    }
  }, [doc.id]);

  // 触发自动保存
  useEffect(() => {
    // 跳过初次加载
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (editor) {
        handleSaveRef.current();
      }
    }, 300);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, description, metaValue, contentVersion, editor]);

  // 获取除 title 和 description 外的其他元数据字段
  const otherMetaKeys = Object.keys(metaValue).filter(
    (k) => k !== "title" && k !== "description"
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* 标题 - Notion 风格 */}
          <div className="mb-1">
            <Input
              value={title}
              onValueChange={setTitle}
              placeholder="无标题"
              className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-muted-foreground/50"
            />
          </div>

          {/* 元数据区块 */}
          <div className="mb-6">
            {/* 折叠按钮 */}
            <button
              type="button"
              onClick={() => setMetaExpanded(!metaExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              {metaExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              元数据
            </button>

            {metaExpanded && (
              <div className="space-y-2 pl-4">
                {/* 描述 */}
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">
                    描述
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      handleDescriptionChange(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="添加描述..."
                    className="flex-1 text-sm text-muted-foreground bg-transparent border-none outline-none resize-none min-h-6 placeholder:text-muted-foreground/40"
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                  />
                </div>

                {/* 其他元数据 */}
                {otherMetaKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2 group">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {key}
                    </span>
                    <Input
                      value={String(metaValue[key] ?? "")}
                      onValueChange={(value) => handleMetaFieldChange(key, value)}
                      className="flex-1 h-7 text-sm bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteMetaField(key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* 添加新字段 */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newFieldKey}
                    onValueChange={setNewFieldKey}
                    placeholder="添加字段..."
                    className="w-16 h-6 text-xs bg-transparent border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/40"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMetaField();
                      }
                    }}
                  />
                  {newFieldKey.trim() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={handleAddMetaField}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 分割线 */}
          <div className="border-t border-border/50 mb-6" />

          {/* 编辑器内容区域 */}
          <div className="flex-1 min-h-0">
            <EditorContent
              editor={editor}
              className="w-full h-full [&_p]:mb-2 [&_.ProseMirror]:min-h-[400px]"
            />
          </div>
          <EditorBubbleMenu editor={editor} />
          <PolishManager editor={editor} />
        </div>
      </div>
    </div>
  );
};
