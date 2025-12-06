import { tool } from "ai";
import { z } from "zod";
import { WebContents, ipcMain } from "electron";

/**
 * Tiptap Agent Operation Protocol (TAOP)
 *
 * 设计理念：
 * 1. 读取层 - 提供文档的纯文本和结构化视图
 * 2. 精确写入层 - 支持 JSONContent 和分段插入
 * 3. 局部修改层 - 支持按位置、按搜索、按选区修改
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

      // 30秒超时（复杂操作可能需要更长时间）
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Tool ${name} execution timed out`));
      }, 30000);

      // 发送请求到渲染进程
      webContents.send("tool:execute", { id: requestId, name, args });
    });
  };

  return {
    // ============ 读取层 ============

    getDocumentText: tool({
      description: "获取当前文档的纯文本内容。适合快速了解文档全貌。",
      inputSchema: z.object({}),
      execute: async () => executeRendererTool("getDocumentText", {}),
    }),

    getDocumentStructure: tool({
      description: "获取文档的结构大纲，包含标题层级。适合理解文档组织。",
      inputSchema: z.object({}),
      execute: async () => executeRendererTool("getDocumentStructure", {}),
    }),

    getSelection: tool({
      description: "获取当前选中的文本及其位置。返回 {text, from, to}。",
      inputSchema: z.object({}),
      execute: async () => executeRendererTool("getSelection", {}),
    }),

    // ============ 精确写入层 ============

    insertParagraphs: tool({
      description:
        "在光标位置插入多个段落。每个数组元素会成为独立的段落，自动换行。",
      inputSchema: z.object({
        paragraphs: z
          .array(z.string())
          .describe("段落内容数组，每个元素是一个段落"),
        position: z
          .enum(["cursor", "start", "end"])
          .optional()
          .describe("插入位置，默认为 cursor"),
      }),
      execute: async (args) => executeRendererTool("insertParagraphs", args),
    }),

    insertNodes: tool({
      description: "插入结构化节点。支持标题、列表、代码块等。",
      inputSchema: z.object({
        nodes: z
          .array(
            z.object({
              type: z
                .enum([
                  "heading",
                  "paragraph",
                  "codeBlock",
                  "bulletList",
                  "orderedList",
                ])
                .describe("节点类型"),
              content: z.string().describe("节点内容"),
              attrs: z
                .record(z.any())
                .optional()
                .describe("节点属性，如 heading 的 level"),
            })
          )
          .describe("要插入的节点数组"),
        position: z.enum(["cursor", "start", "end"]).optional(),
      }),
      execute: async (args) => executeRendererTool("insertNodes", args),
    }),

    setDocument: tool({
      description: "替换整个文档内容。用于全文重写。慎用。",
      inputSchema: z.object({
        paragraphs: z.array(z.string()).describe("新文档的段落数组"),
      }),
      execute: async (args) => executeRendererTool("setDocument", args),
    }),

    // ============ 局部修改层 ============

    replaceSelection: tool({
      description: "替换当前选中的文本。如果用户选中了内容再提问，使用此工具。",
      inputSchema: z.object({
        content: z.string().describe("替换后的内容"),
        asParagraphs: z
          .boolean()
          .optional()
          .describe("是否将内容按换行符分成多个段落"),
      }),
      execute: async (args) => executeRendererTool("replaceSelection", args),
    }),

    replaceBySearch: tool({
      description: "按文本搜索并替换。适合修改文档中的特定内容。",
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

    insertAtPosition: tool({
      description: "在指定位置插入内容。需要先通过 getSelection 获取位置信息。",
      inputSchema: z.object({
        position: z.number().describe("插入位置（字符偏移量）"),
        content: z.string().describe("要插入的内容"),
      }),
      execute: async (args) => executeRendererTool("insertAtPosition", args),
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
