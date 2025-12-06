import { tool } from "ai";
import { z } from "zod";
import { WebContents, ipcMain } from "electron";

/**
 * Tiptap Agent Operation Protocol (TAOP) - 前端编辑器工具
 *
 * ⚠️ 重要设计决策：
 * 所有工具都不依赖选区位置，因为用户可能在 AI 操作期间改变选区。
 *
 * 安全的工具：
 * - 读取类：getDocumentText, getDocumentStructure
 * - 搜索定位：replaceBySearch（通过文本搜索定位）
 * - 固定位置：insertAtStart, insertAtEnd, setDocument
 *
 * 弃用的工具（已移除）：
 * - insertParagraphs (position: "cursor") - 依赖光标位置
 * - insertNodes (position: "cursor") - 依赖光标位置
 * - replaceSelection - 依赖选区
 * - insertAtPosition - 依赖位置信息可能变化
 * - getSelection - 选区可能变化，读取没有意义
 *
 * 推荐使用后端工具 (docContent.ts)：
 * - searchAndReplaceInDoc
 * - appendToDocument / prependToDocument
 * - insertAfterTextInDoc / insertBeforeTextInDoc
 */
export const createDocumentTools = (webContents: WebContents) => {
  /**
   * 执行渲染进程工具的通用方法
   */
  const executeRendererTool = async <T = any>(
    name: string,
    args: any
  ): Promise<T> => {
    const requestId = Math.random().toString(36).substring(7);
    const responseChannel = `tool:result:${requestId}`;

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        ipcMain.removeListener(responseChannel, listener);
        clearTimeout(timeoutId);
      };

      const listener = (_event: any, result: any) => {
        cleanup();
        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      };

      ipcMain.on(responseChannel, listener);

      // 30秒超时
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Tool ${name} execution timed out`));
      }, 30000);

      webContents.send("tool:execute", { id: requestId, name, args });
    });
  };

  return {
    // ============ 读取层（安全） ============

    getDocumentText: tool({
      description:
        "获取当前打开文档的纯文本内容和元数据。返回 content(文本内容)、docId、title、metadata(文档元数据对象)。适合快速了解文档全貌。",
      inputSchema: z.object({}),
      execute: async () => executeRendererTool("getDocumentText", {}),
    }),

    getDocumentStructure: tool({
      description: "获取文档的结构大纲，包含标题层级。适合理解文档组织。",
      inputSchema: z.object({}),
      execute: async () => executeRendererTool("getDocumentStructure", {}),
    }),

    // ============ 写入层（安全 - 固定位置） ============

    insertAtStart: tool({
      description: "在文档开头插入段落。不依赖选区。",
      inputSchema: z.object({
        paragraphs: z
          .array(z.string())
          .describe("段落内容数组，每个元素是一个段落"),
      }),
      execute: async (args) =>
        executeRendererTool("insertParagraphs", {
          paragraphs: args.paragraphs,
          position: "start",
        }),
    }),

    insertAtEnd: tool({
      description: "在文档末尾插入段落。不依赖选区。",
      inputSchema: z.object({
        paragraphs: z
          .array(z.string())
          .describe("段落内容数组，每个元素是一个段落"),
      }),
      execute: async (args) =>
        executeRendererTool("insertParagraphs", {
          paragraphs: args.paragraphs,
          position: "end",
        }),
    }),

    setDocument: tool({
      description: "替换整个文档内容。用于全文重写。慎用。",
      inputSchema: z.object({
        paragraphs: z.array(z.string()).describe("新文档的段落数组"),
      }),
      execute: async (args) => executeRendererTool("setDocument", args),
    }),

    // ============ 修改层（安全 - 搜索定位） ============

    replaceBySearch: tool({
      description:
        "按文本搜索并替换。通过搜索文本定位，不依赖选区。这是修改文档特定内容的推荐方式。",
      inputSchema: z.object({
        search: z.string().describe("要搜索的文本"),
        replace: z.string().describe("替换成的文本"),
        all: z
          .boolean()
          .optional()
          .describe("是否替换所有匹配项，默认只替换第一个"),
      }),
      execute: async (args) => executeRendererTool("replaceBySearch", args),
    }),

    // ============ 辅助工具 ============

    focusEditor: tool({
      description: "将焦点移到编辑器。通常在完成一系列操作后调用。",
      inputSchema: z.object({
        position: z
          .enum(["start", "end", "keep"])
          .optional()
          .describe("焦点位置"),
      }),
      execute: async (args) => executeRendererTool("focusEditor", args),
    }),
  };
};
