/**
 * Markdown Paste Extension
 *
 * 处理 Cmd+V 粘贴 Markdown 内容时的转换
 * - 检测粘贴内容是否包含 Markdown 格式（标题、列表、代码块、表格等）
 * - 如果是 Markdown，转换为 Tiptap JSONContent 后插入
 * - 普通文本保持默认粘贴行为
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { markdownToJSON } from "@common/lib/content-converter";

/**
 * 检测文本是否包含 Markdown 格式
 */
function isMarkdownContent(text: string): boolean {
  // Markdown 格式检测规则
  const patterns = [
    /^#{1,6}\s+.+$/m, // 标题
    /^[-*+]\s+.+$/m, // 无序列表
    /^\d+\.\s+.+$/m, // 有序列表
    /^>\s+.+$/m, // 引用
    /^```/m, // 代码块开始
    /^\|.+\|$/m, // 表格
    /^[-*_]{3,}\s*$/m, // 分隔线
    /\[.+\]\(.+\)/, // 链接
    /!\[.*\]\(.+\)/, // 图片
    /`[^`]+`/, // 行内代码
    /\*\*[^*]+\*\*/, // 粗体
    /^[-*]\s+\[[ x]\]\s+/m, // 任务列表
  ];

  // 如果匹配任意两个 Markdown 模式，或者有代码块/表格/标题，认为是 Markdown
  let matchCount = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matchCount++;
      // 代码块、表格、标题是强信号
      if (
        pattern.source.includes("```") ||
        pattern.source.includes("\\|") ||
        pattern.source.includes("^#")
      ) {
        return true;
      }
    }
  }

  // 包含换行且有 Markdown 格式特征
  return matchCount >= 2 || (text.includes("\n") && matchCount >= 1);
}

export const MarkdownPasteExtension = Extension.create({
  name: "markdownPaste",

  // 使用最高优先级
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste: (view, event) => {
            // 获取粘贴的纯文本内容
            const text = event.clipboardData?.getData("text/plain");
            if (!text || text.trim().length === 0) return false;

            // 检测是否是 Markdown 内容
            if (!isMarkdownContent(text)) {
              return false;
            }

            // 检查是否有 HTML 内容
            const html = event.clipboardData?.getData("text/html");
            // 如果有复杂的 HTML 且不是代码块/表格，让其他处理器处理
            if (html && html.includes("<div") && !text.includes("```") && !text.match(/^\|.+\|$/m)) {
              return false;
            }

            // 阻止默认粘贴行为
            event.preventDefault();

            // 将 Markdown 转换为 JSONContent
            const jsonContent = markdownToJSON(text, {
              preserveEmptyParagraphs: false,
              parseInlineStyles: true,
            });

            // 插入转换后的内容
            if (jsonContent.content && jsonContent.content.length > 0) {
              editor.chain().focus().insertContent(jsonContent.content).run();
            }

            return true;
          },
        },
      }),
    ];
  },
});
