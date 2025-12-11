import { useMemo } from "react";
import { useDocumentStore } from "@/hooks/stores";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@/components/ui/button";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * 从 Tiptap JSONContent 中提取标题
 */
function extractHeadings(content: JSONContent): TocItem[] {
  const headings: TocItem[] = [];

  function traverse(node: JSONContent) {
    if (node.type === "heading" && node.attrs?.level) {
      const text = extractText(node);
      if (text) {
        headings.push({
          id: `heading-${headings.length}`,
          text,
          level: node.attrs.level as number,
        });
      }
    }

    if (node.content) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return headings;
}

/**
 * 从节点中提取纯文本
 */
function extractText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text || "";
  }

  if (node.content) {
    return node.content.map(extractText).join("");
  }

  return "";
}

/**
 * 文档目录视图组件
 */
export const DocTocView = () => {
  const { t } = useTranslation();
  const activeDoc = useDocumentStore((state) => state.activeDoc);

  // 从当前文档内容中提取标题
  const headings = useMemo(() => {
    if (!activeDoc?.content) return [];
    return extractHeadings(activeDoc.content);
  }, [activeDoc?.content]);

  // 没有打开文档
  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center gap-3">
        <List className="size-8 text-muted-foreground/50" />
        <span>{t("common.settings.noDocOpen")}</span>
      </div>
    );
  }

  // 文档没有标题
  if (headings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center gap-3">
        <List className="size-8 text-muted-foreground/50" />
        <span>{t("common.settings.noHeadings")}</span>
      </div>
    );
  }

  // 滚动到对应标题
  const scrollToHeading = (index: number) => {
    // 查找编辑器中的标题元素
    const editorElement = document.querySelector(".ProseMirror");
    if (!editorElement) return;

    const headingElements = editorElement.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );
    const targetHeading = headingElements[index];

    if (targetHeading) {
      targetHeading.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex-1 overflow-auto space-y-0.5">
      {headings.map((heading, index) => (
        <Button
          key={heading.id}
          onClick={() => scrollToHeading(index)}
          className={cn(
            "w-full text-left px-2 rounded-lg text-xs transition-colors",
            "hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground",
            "truncate block"
          )}
          style={{
            paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
          }}
          title={heading.text}
        >
          {heading.text}
        </Button>
      ))}
    </div>
  );
};
