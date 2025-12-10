/**
 * Tiptap Content Converter
 *
 * 提供 Markdown ↔ JSONContent 的双向转换能力
 * 可用于：
 * - Agent 工具（理解和生成结构化内容）
 * - 导入/导出功能
 * - 复制粘贴处理
 */

import type { JSONContent } from "@tiptap/core";

// ==================== Types ====================

export interface ParsedMarkdown {
  title: string;
  body: string;
  metadata: Record<string, any>;
}

export interface ConverterOptions {
  /** 是否保留空段落 */
  preserveEmptyParagraphs?: boolean;
  /** 是否解析内联样式（粗体、斜体等） */
  parseInlineStyles?: boolean;
}

// ==================== Markdown → JSONContent ====================

/**
 * 将 Markdown 转换为 Tiptap JSONContent
 */
export function markdownToJSON(
  markdown: string,
  options?: ConverterOptions
): JSONContent {
  const lines = markdown.split("\n");
  const content: JSONContent[] = [];
  const preserveEmpty = options?.preserveEmptyParagraphs ?? false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: parseInlineContent(headingMatch[2], options),
      });
      i++;
      continue;
    }

    // 代码块
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: "codeBlock",
        attrs: { language: lang || "plaintext" },
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      i++;
      continue;
    }

    // Admonition (:::note, :::tip, :::warning, :::danger, :::info)
    const admonitionMatch = line.match(/^:::(note|tip|warning|danger|info)\s*$/);
    if (admonitionMatch) {
      const admonitionType = admonitionMatch[1];
      const admonitionContent: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^:::$/)) {
        admonitionContent.push(lines[i]);
        i++;
      }
      // 跳过结束的 :::
      if (i < lines.length && lines[i].match(/^:::$/)) {
        i++;
      }
      // 递归解析 admonition 内部内容
      const innerContent = markdownToJSON(admonitionContent.join("\n"), options);
      content.push({
        type: "admonition",
        attrs: { type: admonitionType },
        content: innerContent.content || [{ type: "paragraph", content: [] }],
      });
      continue;
    }

    // 引用块
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("> ") || lines[i].startsWith(">"))
      ) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInlineContent(quoteLines.join("\n"), options),
          },
        ],
      });
      continue;
    }

    // 无序列表
    if (line.match(/^[-*]\s+/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(
                lines[i].replace(/^[-*]\s+/, ""),
                options
              ),
            },
          ],
        });
        i++;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    // 有序列表
    if (line.match(/^\d+\.\s+/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(
                lines[i].replace(/^\d+\.\s+/, ""),
                options
              ),
            },
          ],
        });
        i++;
      }
      content.push({ type: "orderedList", content: items });
      continue;
    }

    // 任务列表
    if (line.match(/^[-*]\s+\[[ x]\]\s+/i)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+\[[ x]\]\s+/i)) {
        const checked = lines[i].match(/^[-*]\s+\[x\]/i) !== null;
        items.push({
          type: "taskItem",
          attrs: { checked },
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(
                lines[i].replace(/^[-*]\s+\[[ x]\]\s+/i, ""),
                options
              ),
            },
          ],
        });
        i++;
      }
      content.push({ type: "taskList", content: items });
      continue;
    }

    // 分隔线
    if (line.match(/^[-*_]{3,}\s*$/)) {
      content.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // 表格（支持行之间有空行的情况）
    if (line.match(/^\|.+\|\s*$/)) {
      const tableRows: JSONContent[] = [];
      let isFirstRow = true;
      let hasSeparator = false;

      // 收集所有连续的表格行（跳过中间的空行）
      while (i < lines.length) {
        const currentLine = lines[i];
        
        // 跳过空行
        if (currentLine.trim() === "") {
          // 向前看是否还有表格行
          let hasMoreTableRows = false;
          for (let j = i + 1; j < lines.length && j < i + 3; j++) {
            if (lines[j].match(/^\|.+\|\s*$/)) {
              hasMoreTableRows = true;
              break;
            }
            if (lines[j].trim() !== "") {
              break; // 遇到非空非表格行，停止
            }
          }
          if (hasMoreTableRows) {
            i++;
            continue;
          } else {
            break; // 没有更多表格行，结束表格解析
          }
        }
        
        // 不是表格行，结束
        if (!currentLine.match(/^\|.+\|\s*$/)) {
          break;
        }
        
        // 检查是否是分隔行 (|---|---|)
        if (currentLine.match(/^\|[\s\-:|]+\|\s*$/)) {
          hasSeparator = true;
          i++;
          continue;
        }

        // 解析单元格内容
        const cellContents = currentLine
          .split("|")
          .slice(1, -1) // 去掉首尾空字符串
          .map((cell) => cell.trim());

        // 如果已经处理过分隔行，第一行之后的都是普通行
        const actualCellType = hasSeparator && !isFirstRow ? "tableCell" : 
                               (isFirstRow ? "tableHeader" : "tableCell");

        const cells: JSONContent[] = cellContents.map((cellText) => ({
          type: actualCellType,
          content: cellText
            ? [
                {
                  type: "paragraph",
                  content: parseInlineContent(cellText, options),
                },
              ]
            : [{ type: "paragraph", content: [] }],
        }));

        tableRows.push({
          type: "tableRow",
          content: cells,
        });

        isFirstRow = false;
        i++;
      }

      if (tableRows.length > 0) {
        content.push({
          type: "table",
          content: tableRows,
        });
      }
      continue;
    }

    // 空行
    if (line.trim() === "") {
      if (preserveEmpty) {
        content.push({ type: "paragraph", content: [] });
      }
      i++;
      continue;
    }

    // 普通段落
    content.push({
      type: "paragraph",
      content: parseInlineContent(line, options),
    });
    i++;
  }

  return { type: "doc", content };
}

/**
 * 解析内联内容（文本、粗体、斜体、链接等）
 */
function parseInlineContent(
  text: string,
  options?: ConverterOptions
): JSONContent[] {
  if (!text) return [];

  // 简单模式：直接返回纯文本（默认启用内联样式解析）
  if (options?.parseInlineStyles === false) {
    return [{ type: "text", text }];
  }

  // 解析内联样式
  const result: JSONContent[] = [];

  // 正则匹配：粗体、斜体、行内代码、链接
  // 优先级：粗斜体 > 粗体 > 斜体 > 行内代码 > 链接
  const inlineRegex =
    /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      result.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // 粗斜体 ***text***
      result.push({
        type: "text",
        text: match[2],
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (match[3]) {
      // 粗体 **text**
      result.push({
        type: "text",
        text: match[4],
        marks: [{ type: "bold" }],
      });
    } else if (match[5]) {
      // 斜体 *text*
      result.push({
        type: "text",
        text: match[6],
        marks: [{ type: "italic" }],
      });
    } else if (match[7]) {
      // 行内代码 `code`
      result.push({
        type: "text",
        text: match[8],
        marks: [{ type: "code" }],
      });
    } else if (match[9]) {
      // 链接 [text](url)
      result.push({
        type: "text",
        text: match[10],
        marks: [{ type: "link", attrs: { href: match[11] } }],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    result.push({ type: "text", text: text.slice(lastIndex) });
  }

  // 如果没有匹配到任何内联样式，返回纯文本
  if (result.length === 0) {
    return [{ type: "text", text }];
  }

  return result;
}

// ==================== JSONContent → Markdown ====================

/**
 * 将 Tiptap JSONContent 转换为 Markdown
 */
export function jsonToMarkdown(content: JSONContent): string {
  if (!content.content) return "";

  const lines: string[] = [];

  const extractText = (node: JSONContent): string => {
    if (node.text) return node.text;
    if (!node.content) return "";
    return node.content.map(extractText).join("");
  };

  for (const node of content.content) {
    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level || 1;
        const text = extractText(node);
        lines.push(`${"#".repeat(level)} ${text}`);
        lines.push("");
        break;
      }

      case "paragraph": {
        const text = extractText(node);
        lines.push(text);
        lines.push("");
        break;
      }

      case "bulletList": {
        if (node.content) {
          for (const item of node.content) {
            const text = extractText(item);
            lines.push(`- ${text}`);
          }
          lines.push("");
        }
        break;
      }

      case "orderedList": {
        if (node.content) {
          node.content.forEach((item, i) => {
            const text = extractText(item);
            lines.push(`${i + 1}. ${text}`);
          });
          lines.push("");
        }
        break;
      }

      case "taskList": {
        if (node.content) {
          for (const item of node.content) {
            const checked = item.attrs?.checked ? "x" : " ";
            const text = extractText(item);
            lines.push(`- [${checked}] ${text}`);
          }
          lines.push("");
        }
        break;
      }

      case "codeBlock": {
        const lang = node.attrs?.language || "";
        const text = extractText(node);
        lines.push(`\`\`\`${lang}`);
        lines.push(text);
        lines.push("```");
        lines.push("");
        break;
      }

      case "blockquote": {
        const text = extractText(node);
        const quotedLines = text.split("\n").map((l) => `> ${l}`);
        lines.push(...quotedLines);
        lines.push("");
        break;
      }

      case "horizontalRule": {
        lines.push("---");
        lines.push("");
        break;
      }

      case "admonition": {
        const admonitionType = node.attrs?.type || "note";
        lines.push(`:::${admonitionType}`);
        if (node.content) {
          // 递归转换 admonition 内部内容
          const innerMarkdown = jsonToMarkdown({ type: "doc", content: node.content });
          lines.push(innerMarkdown);
        }
        lines.push(":::");
        lines.push("");
        break;
      }

      case "table": {
        if (node.content) {
          const rows: string[][] = [];

          for (const row of node.content) {
            if (row.type === "tableRow" && row.content) {
              const cells: string[] = [];
              for (const cell of row.content) {
                cells.push(extractText(cell));
              }
              rows.push(cells);
            }
          }

          if (rows.length > 0) {
            // 输出第一行
            lines.push(`| ${rows[0].join(" | ")} |`);
            
            // 输出分隔行
            const separator = rows[0].map(() => "---").join(" | ");
            lines.push(`| ${separator} |`);
            
            // 输出其余行
            for (let i = 1; i < rows.length; i++) {
              lines.push(`| ${rows[i].join(" | ")} |`);
            }
            lines.push("");
          }
        }
        break;
      }

      default: {
        const text = extractText(node);
        if (text) {
          lines.push(text);
          lines.push("");
        }
      }
    }
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // 将连续3个及以上换行符替换为2个
    .trim();
}

// ==================== Frontmatter 处理 ====================

/**
 * 解析带 Frontmatter 的 Markdown 文件
 */
export function parseMarkdownWithFrontmatter(
  content: string,
  fallbackTitle?: string
): ParsedMarkdown {
  let title = fallbackTitle || "Untitled";
  let body = content;
  let metadata: Record<string, any> = {};

  // 解析 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    body = frontmatterMatch[2];

    // 简单解析 YAML frontmatter
    for (const line of frontmatter.split("\n")) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (key === "title") {
          title = value.replace(/^["']|["']$/g, "");
        } else {
          try {
            metadata[key] = JSON.parse(value);
          } catch {
            metadata[key] = value.replace(/^["']|["']$/g, "");
          }
        }
      }
    }
  }

  return { title, body: body.trim(), metadata };
}

/**
 * 将 Markdown 和 Frontmatter 合并为完整文件内容
 */
export function stringifyWithFrontmatter(
  body: string,
  metadata?: Record<string, any>
): string {
  const meta = metadata ?? {};
  if (Object.keys(meta).length === 0) {
    return body;
  }

  const lines = Object.entries(meta).map(([key, value]) => {
    if (typeof value === "object") {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return `${key}: ${String(value)}`;
  });

  return "---\n" + lines.join("\n") + "\n---\n\n" + body;
}

// ==================== 便捷方法 ====================

/**
 * 文本 → JSONContent（按段落分割）
 */
export function textToParagraphs(text: string): JSONContent {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p.replace(/\n/g, " ") }],
    })),
  };
}

/**
 * 创建空文档
 */
export function createEmptyDoc(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [] }],
  };
}

/**
 * 创建包含单个段落的文档
 */
export function createDocWithText(text: string): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      },
    ],
  };
}

/**
 * 从 JSONContent 提取纯文本
 */
export function jsonToText(content: JSONContent): string {
  const extractText = (node: JSONContent): string => {
    if (node.text) return node.text;
    if (!node.content) return "";
    return node.content.map(extractText).join("");
  };

  if (!content.content) return "";

  return content.content
    .map((node) => extractText(node))
    .filter(Boolean)
    .join("\n\n");
}

// ==================== 内容修改 ====================

/**
 * 在 JSONContent 中搜索并替换文本
 * 返回修改后的内容和替换次数
 */
export function searchAndReplace(
  content: JSONContent,
  search: string,
  replace: string,
  options?: { all?: boolean }
): { content: JSONContent; count: number } {
  let count = 0;
  const replaceAll = options?.all ?? false;

  const processNode = (node: JSONContent): JSONContent => {
    // 文本节点 - 执行替换
    if (node.type === "text" && node.text) {
      if (replaceAll) {
        const parts = node.text.split(search);
        if (parts.length > 1) {
          count += parts.length - 1;
          return { ...node, text: parts.join(replace) };
        }
      } else if (count === 0 && node.text.includes(search)) {
        count = 1;
        return { ...node, text: node.text.replace(search, replace) };
      }
      return node;
    }

    // 有子节点的节点 - 递归处理
    if (node.content && Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(processNode),
      };
    }

    return node;
  };

  const newContent = processNode(content);
  return { content: newContent, count };
}

/**
 * 在文档末尾追加段落
 */
export function appendParagraphs(
  content: JSONContent,
  paragraphs: string[]
): JSONContent {
  const newNodes: JSONContent[] = paragraphs.map((text) => ({
    type: "paragraph",
    content: text ? [{ type: "text", text }] : [],
  }));

  return {
    ...content,
    content: [...(content.content || []), ...newNodes],
  };
}

/**
 * 在文档开头插入段落
 */
export function prependParagraphs(
  content: JSONContent,
  paragraphs: string[]
): JSONContent {
  const newNodes: JSONContent[] = paragraphs.map((text) => ({
    type: "paragraph",
    content: text ? [{ type: "text", text }] : [],
  }));

  return {
    ...content,
    content: [...newNodes, ...(content.content || [])],
  };
}

/**
 * 替换整个文档内容
 */
export function replaceDocContent(paragraphs: string[]): JSONContent {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

/**
 * 在找到的文本后面插入内容
 * 不依赖选区，通过搜索文本定位
 */
export function insertAfterText(
  content: JSONContent,
  searchText: string,
  insertText: string
): { content: JSONContent; found: boolean } {
  let found = false;

  const processNode = (node: JSONContent): JSONContent => {
    if (found) return node;

    // 文本节点 - 在找到的文本后插入
    if (node.type === "text" && node.text) {
      const index = node.text.indexOf(searchText);
      if (index !== -1) {
        found = true;
        const insertPos = index + searchText.length;
        return {
          ...node,
          text:
            node.text.slice(0, insertPos) +
            insertText +
            node.text.slice(insertPos),
        };
      }
      return node;
    }

    // 有子节点的节点 - 递归处理
    if (node.content && Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(processNode),
      };
    }

    return node;
  };

  const newContent = processNode(content);
  return { content: newContent, found };
}

/**
 * 在找到的文本前面插入内容
 * 不依赖选区，通过搜索文本定位
 */
export function insertBeforeText(
  content: JSONContent,
  searchText: string,
  insertText: string
): { content: JSONContent; found: boolean } {
  let found = false;

  const processNode = (node: JSONContent): JSONContent => {
    if (found) return node;

    // 文本节点 - 在找到的文本前插入
    if (node.type === "text" && node.text) {
      const index = node.text.indexOf(searchText);
      if (index !== -1) {
        found = true;
        return {
          ...node,
          text: node.text.slice(0, index) + insertText + node.text.slice(index),
        };
      }
      return node;
    }

    // 有子节点的节点 - 递归处理
    if (node.content && Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(processNode),
      };
    }

    return node;
  };

  const newContent = processNode(content);
  return { content: newContent, found };
}
