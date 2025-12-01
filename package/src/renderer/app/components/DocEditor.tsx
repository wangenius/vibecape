import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { DocFile } from "@common/types/docs";
import { toast } from "sonner";
import { Loader2, Save, ScrollText } from "lucide-react";
import { BaseEditor } from "@/components/editor/BaseEditor";
import {
  DEFAULT_TIPTAP_CONTENT,
  type TiptapContent,
} from "@/components/editor/tiptap-types";

type Props = {
  storyTitle: string;
  docPath: string;
  doc: DocFile;
  onSave: (content: string, metadata?: Record<string, any>) => Promise<DocFile>;
};

// 将纯文本转换成简单的 tiptap JSON（按空行分段）
function textToTiptap(text: string): TiptapContent {
  const paragraphs = text
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      type: "paragraph",
      content: [{ type: "text", text: block }],
    }));

  if (paragraphs.length === 0) {
    return DEFAULT_TIPTAP_CONTENT;
  }

  return {
    type: "doc",
    content: paragraphs,
  };
}

// 将 tiptap JSON 转回纯文本（简单拼段落）
function tiptapToText(content: TiptapContent): string {
  if (!content?.content) return "";
  return content.content
    .map((node) => {
      if (node.type !== "paragraph" || !node.content) return "";
      return node.content
        .map((child: any) => (child.type === "text" ? child.text || "" : ""))
        .join("");
    })
    .join("\n\n")
    .trim();
}

export const DocEditor = ({ storyTitle, docPath, doc, onSave }: Props) => {
  const [editorValue, setEditorValue] = useState<TiptapContent>(
    textToTiptap(doc.content)
  );
  const [metaText, setMetaText] = useState(
    JSON.stringify(doc.metadata ?? {}, null, 2)
  );
  const [metaValue, setMetaValue] = useState<Record<string, any>>(
    doc.metadata ?? {}
  );
  const [metaError, setMetaError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditorValue(textToTiptap(doc.content));
    setMetaValue(doc.metadata ?? {});
    setMetaText(JSON.stringify(doc.metadata ?? {}, null, 2));
    setMetaError(null);
  }, [doc.path, doc.content, doc.metadata]);

  const isDirty = useMemo(() => {
    const baseMeta = JSON.stringify(doc.metadata ?? {}, null, 2);
    return tiptapToText(editorValue) !== doc.content || metaText !== baseMeta;
  }, [editorValue, doc.content, doc.metadata, metaText]);

  const handleMetaChange = (value: string) => {
    setMetaText(value);
    if (!value.trim()) {
      setMetaValue({});
      setMetaError(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setMetaValue(parsed);
      setMetaError(null);
    } catch (error) {
      setMetaError("元数据需要是有效的 JSON");
    }
  };

  const handleSave = async () => {
    if (metaError) {
      toast.error("请先修复元数据 JSON");
      return;
    }

    setSaving(true);
    try {
      const text = tiptapToText(editorValue);
      await onSave(text, metaValue);
      toast.success("已保存");
    } catch (error) {
      toast.error((error as Error).message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{storyTitle}</div>
          <div className="text-sm font-medium">{docPath}</div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs ${
              isDirty ? "text-amber-500" : "text-muted-foreground"
            }`}
          >
            {isDirty ? "未保存" : "已同步"}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-3 h-full overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">内容</span>
            <span className="text-[11px] text-muted-foreground">
              使用 SimpleEditor 编辑，保存写入 frontmatter 后的 MDX
            </span>
          </div>
          <div className="flex-1 rounded-lg border border-border bg-background p-2 overflow-hidden">
            <BaseEditor
              key={doc.path}
              defaultValue={editorValue}
              onChange={setEditorValue}
              className="prose prose-sm max-w-none dark:prose-invert min-h-[360px]"
              placeholder="开始书写..."
            />
          </div>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">预览</span>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-auto rounded-lg border border-border bg-muted/20 p-4 prose prose-sm dark:prose-invert">
            <ReactMarkdown>
              {tiptapToText(editorValue) || "开始书写..."}
            </ReactMarkdown>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                元数据（JSON）
              </span>
              {metaError ? (
                <span className="text-[11px] text-red-500">{metaError}</span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  保存时写入 frontmatter
                </span>
              )}
            </div>
            <textarea
              className="w-full h-32 rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={metaText}
              onChange={(e) => handleMetaChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
