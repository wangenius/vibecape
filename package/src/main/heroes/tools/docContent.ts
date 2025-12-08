/**
 * 文档内容编辑工具集
 *
 * 所有修改直接在主进程完成，不依赖前端 selection：
 * - 读取文档内容
 * - 搜索替换
 * - 追加/插入内容
 * - 替换整文档
 *
 * 修改后自动通知前端刷新
 */

import { tool, generateText } from "ai";
import { z } from "zod";
import { DocsService } from "@main/services/Docs";
import { Model } from "@main/services/Model";
import {
  jsonToText,
  jsonToMarkdown,
  markdownToJSON,
  searchAndReplace,
  insertAfterText,
  insertBeforeText,
} from "@common/lib/content-converter";
import type { WebContents } from "electron";

/**
 * 创建文档内容编辑工具
 * @param webContents - 用于通知前端刷新
 */
export const createDocContentTools = (webContents: WebContents) => {
  /**
   * 通知前端文档内容已变更
   */
  const notifyContentChange = (docId: string) => {
    webContents.send("docs:changed", { tool: "contentEdit", docId });
  };

  return {
    // ============ 读取工具 ============

    readDocumentContent: tool({
      description:
        "读取指定文档的内容。返回纯文本格式，便于理解文档全貌。如果不传 docId，则读取当前活跃文档。",
      inputSchema: z.object({
        docId: z
          .string()
          .optional()
          .describe("文档 ID，不传则读取当前活跃文档"),
      }),
      execute: async ({ docId }) => {
        try {
          // 如果没有 docId，尝试从当前状态获取
          if (!docId) {
            return {
              success: false,
              error: "请提供 docId，或使用 getDocumentTree 查找文档",
            };
          }

          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          const text = jsonToText(doc.content);
          const markdown = jsonToMarkdown(doc.content);

          return {
            success: true,
            docId: doc.id,
            title: doc.title,
            text,
            markdown,
            wordCount: text.length,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 搜索替换 ============

    searchAndReplaceInDoc: tool({
      description: "在指定文档中搜索文本并替换。这是修改文档内容的推荐方式。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        search: z.string().describe("要搜索的文本"),
        replace: z.string().describe("替换成的文本"),
        all: z
          .boolean()
          .optional()
          .describe("是否替换所有匹配项，默认只替换第一个"),
      }),
      execute: async ({ docId, search, replace, all = false }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          const result = searchAndReplace(doc.content, search, replace, {
            all,
          });

          if (result.count === 0) {
            return {
              success: false,
              replaced: 0,
              error: `未找到匹配内容: "${search}"`,
            };
          }

          await DocsService.updateDoc(docId, { content: result.content });
          notifyContentChange(docId);

          return {
            success: true,
            replaced: result.count,
            message: `已替换 ${result.count} 处`,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 追加/插入内容 ============

    appendToDocument: tool({
      description:
        "在文档末尾追加内容。提供一个 prompt 描述要追加的内容，AI 会根据文档上下文生成合适的内容。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        prompt: z
          .string()
          .describe(
            "描述要追加的内容的 prompt，包含背景、要求、注意事项等。AI 会根据此 prompt 和文档上下文生成内容。"
          ),
      }),
      execute: async ({ docId, prompt }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          // 获取当前文档内容作为上下文
          const currentContent = jsonToMarkdown(doc.content);

          // 调用 AI 生成内容
          let model;
          try {
            model = await Model.get("fast");
          } catch {
            model = await Model.get("primary");
          }

          const result = await generateText({
            model,
            messages: [
              {
                role: "system",
                content: `你是一个文档编辑助手。用户会提供一个文档的当前内容和一个追加内容的请求。
请根据请求生成要追加到文档末尾的内容。

要求：
1. 直接输出要追加的 Markdown 格式内容，不要包含任何解释或前缀
2. 保持与现有文档风格一致
3. 内容应该是完整的、可以直接追加的段落`,
              },
              {
                role: "user",
                content: `当前文档内容：
${currentContent || "（空文档）"}

追加请求：${prompt}`,
              },
            ],
          });

          const generatedMarkdown = result.text.trim();
          const generatedContent = markdownToJSON(generatedMarkdown);

          // 合并内容 - 确保结构正确
          const newContent = {
            type: "doc",
            content: [
              ...(doc.content?.content || []),
              ...(generatedContent.content || []),
            ],
          };

          await DocsService.updateDoc(docId, { content: newContent });
          notifyContentChange(docId);

          return {
            success: true,
            message: "已追加 AI 生成的内容",
            generatedContent: generatedMarkdown,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    prependToDocument: tool({
      description:
        "在文档开头插入内容。提供一个 prompt 描述要插入的内容，AI 会根据文档上下文生成合适的内容。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        prompt: z
          .string()
          .describe(
            "描述要插入的内容的 prompt，包含背景、要求、注意事项等。AI 会根据此 prompt 和文档上下文生成内容。"
          ),
      }),
      execute: async ({ docId, prompt }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          // 获取当前文档内容作为上下文
          const currentContent = jsonToMarkdown(doc.content);

          // 调用 AI 生成内容
          let model;
          try {
            model = await Model.get("fast");
          } catch {
            model = await Model.get("primary");
          }

          const result = await generateText({
            model,
            messages: [
              {
                role: "system",
                content: `你是一个文档编辑助手。用户会提供一个文档的当前内容和一个在开头插入内容的请求。
请根据请求生成要插入到文档开头的内容。

要求：
1. 直接输出要插入的 Markdown 格式内容，不要包含任何解释或前缀
2. 保持与现有文档风格一致
3. 内容应该是完整的、可以直接插入的段落`,
              },
              {
                role: "user",
                content: `当前文档内容：
${currentContent || "（空文档）"}

插入请求：${prompt}`,
              },
            ],
          });

          const generatedMarkdown = result.text.trim();
          const generatedContent = markdownToJSON(generatedMarkdown);

          // 合并内容（插入到开头）- 确保结构正确
          const newContent = {
            type: "doc",
            content: [
              ...(generatedContent.content || []),
              ...(doc.content?.content || []),
            ],
          };

          await DocsService.updateDoc(docId, { content: newContent });
          notifyContentChange(docId);

          return {
            success: true,
            message: "已在开头插入 AI 生成的内容",
            generatedContent: generatedMarkdown,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 替换整文档 ============

    setDocumentFromMarkdown: tool({
      description:
        "使用 Markdown 格式设置文档内容。提供一个 prompt 描述文档内容，AI 会生成 Markdown 格式的完整文档。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        prompt: z
          .string()
          .describe(
            "描述文档内容的 prompt，包含背景、要求、结构、格式要求等。AI 会生成 Markdown 格式的文档内容。"
          ),
      }),
      execute: async ({ docId, prompt }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          // 调用 AI 生成 Markdown 内容
          let model;
          try {
            model = await Model.get("fast");
          } catch {
            model = await Model.get("primary");
          }

          const result = await generateText({
            model,
            messages: [
              {
                role: "system",
                content: `你是一个文档编辑助手。用户会提供一个文档内容的请求。
请根据请求生成 Markdown 格式的文档内容。

要求：
1. 直接输出 Markdown 格式的文档内容，不要包含任何解释或前缀
2. 充分利用 Markdown 语法（标题、列表、代码块、引用、表格等）
3. 内容应该是完整的、结构清晰的文档`,
              },
              {
                role: "user",
                content: `文档标题：${doc.title}

内容请求：${prompt}`,
              },
            ],
          });

          const generatedMarkdown = result.text.trim();
          const newContent = markdownToJSON(generatedMarkdown);
          await DocsService.updateDoc(docId, { content: newContent });
          notifyContentChange(docId);

          return {
            success: true,
            message: "已使用 AI 生成的 Markdown 更新文档内容",
            generatedContent: generatedMarkdown,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 按文本位置插入（不依赖选区） ============

    insertAfterTextInDoc: tool({
      description:
        "在文档中找到指定文本后插入内容。不依赖选区，通过文本搜索定位。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        searchText: z.string().describe("要查找的文本（插入位置的锚点）"),
        insertText: z.string().describe("要在锚点后面插入的内容"),
      }),
      execute: async ({ docId, searchText, insertText }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          const result = insertAfterText(doc.content, searchText, insertText);

          if (!result.found) {
            return {
              success: false,
              error: `未找到文本: "${searchText}"`,
            };
          }

          await DocsService.updateDoc(docId, { content: result.content });
          notifyContentChange(docId);

          return {
            success: true,
            message: `已在 "${searchText}" 后插入内容`,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    insertBeforeTextInDoc: tool({
      description:
        "在文档中找到指定文本前插入内容。不依赖选区，通过文本搜索定位。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        searchText: z.string().describe("要查找的文本（插入位置的锚点）"),
        insertText: z.string().describe("要在锚点前面插入的内容"),
      }),
      execute: async ({ docId, searchText, insertText }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          const result = insertBeforeText(doc.content, searchText, insertText);

          if (!result.found) {
            return {
              success: false,
              error: `未找到文本: "${searchText}"`,
            };
          }

          await DocsService.updateDoc(docId, { content: result.content });
          notifyContentChange(docId);

          return {
            success: true,
            message: `已在 "${searchText}" 前插入内容`,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),
  };
};
