import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/core";
import type { DocData } from "@common/schema/docs";

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
  const [metaValue, setMetaValue] = useState<Record<string, any>>(
    doc.metadata ?? {}
  );
  const [metaError, setMetaError] = useState<string | null>(null);

  // 用 ref 存储 save 函数，解决循环引用问题
  const handleSaveRef = useRef<() => void>(() => {});

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder: "开始书写你的内容...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
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
          "text-base overflow-x-hidden h-full focus:outline-none prose prose-sm dark:prose-invert max-w-none px-6 py-4",
      },
    },
  });

  // 更新编辑器内容当文档变化时
  useEffect(() => {
    if (editor && doc.id) {
      editor.commands.setContent(doc.content);
      setTitle(doc.title);
      setMetaValue(doc.metadata ?? {});
      setMetaError(null);
    }
  }, [doc.id, doc.content, doc.title, doc.metadata, editor]);

  // 更新 title 时同步到 metaValue
  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  // 更新其他元数据字段
  const handleMetaFieldChange = (key: string, value: string) => {
    setMetaValue((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!editor) return;
    if (metaError) {
      toast.error("请先修复元数据");
      return;
    }

    try {
      const content = editor.getJSON();
      await onSave({
        title: title !== doc.title ? title : undefined,
        content,
        metadata: metaValue,
      });
      toast.success("保存成功");
    } catch (error) {
      toast.error((error as Error).message || "保存失败");
    }
  }, [editor, metaError, metaValue, title, doc.title, onSave]);

  // 更新 ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 获取除 title 外的其他元数据字段
  const otherMetaKeys = Object.keys(metaValue).filter((k) => k !== "title");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 标题输入 + 元数据 Popover */}
      <div className="px-6 pt-6 pb-2 flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="文档标题..."
          className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="text-sm font-medium">元数据</div>
              {otherMetaKeys.length > 0 ? (
                <div className="space-y-2">
                  {otherMetaKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {key}
                      </span>
                      <Input
                        value={String(metaValue[key] ?? "")}
                        onChange={(e) =>
                          handleMetaFieldChange(key, e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  暂无其他元数据字段
                </p>
              )}
              {metaError && (
                <p className="text-xs text-red-500">{metaError}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-auto">
        <EditorContent
          editor={editor}
          className="w-full h-full flex-1 [&_p]:mb-2"
        />
      </div>
    </div>
  );
};
