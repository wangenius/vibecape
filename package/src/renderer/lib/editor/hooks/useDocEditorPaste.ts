import { EditorView } from "@tiptap/pm/view";
import { Slice, Fragment } from "@tiptap/pm/model";
import { markdownToJSON } from "@common/lib/content-converter";

/**
 * Markdown 格式检测模式
 */
const MD_PATTERNS = [
  /^#{1,6}\s+.+$/m, // 标题
  /^[-*+]\s+.+$/m, // 无序列表
  /^\d+\.\s+.+$/m, // 有序列表
  /^>\s+.+$/m, // 引用
  /^```/m, // 代码块
  /^\|.+\|$/m, // 表格
];

/**
 * 检测文本是否为 Markdown 格式
 */
const detectMarkdown = (text: string): boolean => {
  let matchCount = 0;
  let hasStrongSignal = false;

  for (const pattern of MD_PATTERNS) {
    if (pattern.test(text)) {
      matchCount++;
      if (
        pattern.source.includes("```") ||
        pattern.source.includes("\\|") ||
        pattern.source.includes("^#")
      ) {
        hasStrongSignal = true;
      }
    }
  }

  return (
    hasStrongSignal ||
    matchCount >= 2 ||
    (text.includes("\n") && matchCount >= 1)
  );
};

/**
 * 创建 Markdown 粘贴处理器
 */
export const createPasteHandler = () => {
  return (view: EditorView, event: ClipboardEvent): boolean => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text || text.trim().length === 0) return false;

    // 检测是否是 Markdown
    if (!detectMarkdown(text)) return false;

    // 检查是否有复杂 HTML（从网页复制）
    const html = event.clipboardData?.getData("text/html");
    if (
      html &&
      html.includes("<div") &&
      !text.includes("```") &&
      !text.match(/^\|.+\|$/m)
    ) {
      return false;
    }

    // 阻止默认行为，转换 Markdown 并插入
    event.preventDefault();
    const jsonContent = markdownToJSON(text, {
      preserveEmptyParagraphs: false,
      parseInlineStyles: true,
    });

    if (jsonContent.content && jsonContent.content.length > 0) {
      const { state, dispatch } = view;
      const { schema, tr } = state;

      // 将 JSONContent 转换为 ProseMirror 节点
      const nodes = jsonContent.content.map((nodeJson: any) => {
        try {
          return schema.nodeFromJSON(nodeJson);
        } catch (e) {
          // 如果转换失败，创建纯文本段落
          const text = nodeJson.content?.[0]?.text || "";
          return schema.nodes.paragraph.create(
            null,
            text ? schema.text(text) : null
          );
        }
      });

      // 插入所有节点
      const fragment = Fragment.fromArray(nodes);
      const transaction = tr.replaceSelection(new Slice(fragment, 0, 0));
      dispatch(transaction);
    }

    return true;
  };
};

/**
 * 编辑器属性配置
 */
export const editorPropsConfig = {
  attributes: {
    class:
      "text-base overflow-x-hidden focus:outline-none prose prose-sm dark:prose-invert max-w-none",
    spellcheck: "false",
  },
  handlePaste: createPasteHandler(),
};
