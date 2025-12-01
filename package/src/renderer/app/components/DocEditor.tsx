import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DocFile } from "@common/types/docs";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { AdmonitionExtension } from "./extensions/AdmonitionExtension";

// Admonition 样式映射
const admonitionStyles: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ️" },
  warning: { bg: "#fefce8", border: "#eab308", icon: "⚠️" },
  danger: { bg: "#fef2f2", border: "#ef4444", icon: "🚨" },
  tip: { bg: "#f0fdf4", border: "#22c55e", icon: "💡" },
  note: { bg: "#f9fafb", border: "#6b7280", icon: "📝" },
};

// 将 Markdown 中的 admonition 和链接转换为 HTML
function preprocessMarkdown(markdown: string): string {
  let result = markdown;
  
  // 1. 处理 admonition：匹配 :::type title="xxx" ... ::: 格式
  const admonitionRegex = /:::(info|warning|danger|tip|note)(?:\s+title="([^"]*)")?\n([\s\S]*?):::/g;
  result = result.replace(admonitionRegex, (_, type, title, content) => {
    const style = admonitionStyles[type] || admonitionStyles.info;
    const displayTitle = title || type.charAt(0).toUpperCase() + type.slice(1);
    return `<div data-admonition="true" data-type="${type}" data-title="${displayTitle}" style="background:${style.bg};border-left:4px solid ${style.border};padding:12px 16px;margin:16px 0;border-radius:8px;"><div style="display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px;">${style.icon} ${displayTitle}</div><div>${content.trim()}</div></div>`;
  });
  
  // 2. 处理 markdown 链接：[text](url) -> <a href="url">text</a>
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  result = result.replace(linkRegex, '<a href="$2">$1</a>');
  
  return result;
}

// 将 HTML 中的 admonition 转换回 Markdown
function postprocessMarkdown(markdown: string): string {
  // 这里的 markdown 输出已经是纯文本，admonition 会保持 HTML 格式
  // 需要将 HTML admonition 转回 ::: 格式
  const htmlAdmonitionRegex = /<div data-admonition="true" data-type="([^"]*)" data-title="([^"]*)"[^>]*>.*?<div[^>]*>([^<]*)<\/div><\/div>/g;
  
  return markdown.replace(htmlAdmonitionRegex, (_, type, title, content) => {
    const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);
    const titleAttr = title !== defaultTitle ? ` title="${title}"` : "";
    return `:::${type}${titleAttr}\n${content.trim()}\n:::`;
  });
}

type Props = {
  doc: DocFile;
  onSave: (content: string, metadata?: Record<string, any>) => Promise<DocFile>;
};

export const DocEditor = ({ doc, onSave }: Props) => {
  const [title, setTitle] = useState(doc.metadata?.title ?? "");
  const [metaValue, setMetaValue] = useState<Record<string, any>>(
    doc.metadata ?? {}
  );
  const [metaError, setMetaError] = useState<string | null>(null);

  // 用 ref 存储 save 函数，解决循环引用问题
  const handleSaveRef = useRef<() => void>(() => {});

  // 预处理后的内容
  const processedContent = useMemo(
    () => preprocessMarkdown(doc.content),
    [doc.content]
  );

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
      Markdown.configure({
        html: true,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      AdmonitionExtension,
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
    content: processedContent,
    editorProps: {
      attributes: {
        class:
          "text-base overflow-x-hidden h-full focus:outline-none prose prose-sm dark:prose-invert max-w-none px-6 py-4",
      },
    },
  });

  // 更新编辑器内容当文档变化时
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(processedContent);
    }
    setTitle(doc.metadata?.title ?? "");
    setMetaValue(doc.metadata ?? {});
    setMetaError(null);
  }, [doc.path, processedContent, doc.metadata, editor]);

  // 更新 title 时同步到 metaValue
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setMetaValue((prev) => ({ ...prev, title: value }));
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
      const rawMarkdown = (editor.storage as any).markdown.getMarkdown();
      const content = postprocessMarkdown(rawMarkdown);
      await onSave(content, metaValue);
    } catch (error) {
      toast.error((error as Error).message || "保存失败");
    }
  }, [editor, metaError, metaValue, onSave]);

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
