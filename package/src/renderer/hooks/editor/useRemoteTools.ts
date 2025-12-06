import { useEffect } from "react";
import { Editor } from "@tiptap/react";
import { JSONContent } from "@tiptap/core";

/**
 * Tiptap Agent Operation Protocol (TAOP) - Renderer Implementation
 *
 * 监听来自主进程的工具执行请求，操作 Tiptap 编辑器
 */
export const useRemoteTools = (editor: Editor | null) => {
  useEffect(() => {
    if (!editor) return;

    /**
     * 将字符串数组转换为段落节点数组
     */
    const paragraphsToJSON = (paragraphs: string[]): JSONContent[] => {
      return paragraphs.map((text) => ({
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      }));
    };

    /**
     * 将结构化节点描述转换为 JSONContent
     */
    const nodeToJSON = (node: {
      type: string;
      content: string;
      attrs?: Record<string, any>;
    }): JSONContent => {
      switch (node.type) {
        case "heading":
          return {
            type: "heading",
            attrs: { level: node.attrs?.level || 1 },
            content: [{ type: "text", text: node.content }],
          };
        case "codeBlock":
          return {
            type: "codeBlock",
            attrs: { language: node.attrs?.language || "plaintext" },
            content: [{ type: "text", text: node.content }],
          };
        case "bulletList":
          return {
            type: "bulletList",
            content: node.content
              .split("\n")
              .filter(Boolean)
              .map((item) => ({
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: item }],
                  },
                ],
              })),
          };
        case "orderedList":
          return {
            type: "orderedList",
            content: node.content
              .split("\n")
              .filter(Boolean)
              .map((item) => ({
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: item }],
                  },
                ],
              })),
          };
        case "paragraph":
        default:
          return {
            type: "paragraph",
            content: node.content ? [{ type: "text", text: node.content }] : [],
          };
      }
    };

    /**
     * 在文档中搜索文本并返回位置
     */
    const searchText = (
      searchStr: string
    ): { from: number; to: number } | null => {
      const doc = editor.state.doc;
      let found: { from: number; to: number } | null = null;

      doc.descendants((node, pos) => {
        if (found) return false; // 已找到，停止搜索
        if (node.isText && node.text) {
          const index = node.text.indexOf(searchStr);
          if (index !== -1) {
            found = { from: pos + index, to: pos + index + searchStr.length };
            return false;
          }
        }
        return true; // 继续搜索
      });

      return found;
    };

    /**
     * 搜索所有匹配项
     */
    const searchAllText = (
      searchStr: string
    ): { from: number; to: number }[] => {
      const doc = editor.state.doc;
      const results: { from: number; to: number }[] = [];

      doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          let index = 0;
          while ((index = node.text.indexOf(searchStr, index)) !== -1) {
            results.push({
              from: pos + index,
              to: pos + index + searchStr.length,
            });
            index += searchStr.length;
          }
        }
      });

      return results;
    };

    /**
     * 提取文档大纲
     */
    const extractOutline = (): {
      level: number;
      text: string;
      pos: number;
    }[] => {
      const outline: { level: number; text: string; pos: number }[] = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.attrs.level) {
          outline.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });

      return outline;
    };

    const handleToolExecute = (
      _event: any,
      payload: { id: string; name: string; args: any }
    ) => {
      const { id, name, args } = payload;
      const responseChannel = `tool:result:${id}`;

      console.log(`[TAOP] Executing tool: ${name}`, args);

      try {
        let result: any = { success: true };

        switch (name) {
          // ============ 读取层 ============

          case "getDocumentText":
            result = { content: editor.getText() };
            break;

          case "getDocumentStructure":
            result = { outline: extractOutline() };
            break;

          case "getSelection": {
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, " ");
            result = { text, from, to, hasSelection: from !== to };
            break;
          }

          // ============ 精确写入层 ============

          case "insertParagraphs": {
            const { paragraphs, position = "cursor" } = args;
            const nodes = paragraphsToJSON(paragraphs);

            if (position === "start") {
              editor.chain().focus("start").insertContent(nodes).run();
            } else if (position === "end") {
              editor.chain().focus("end").insertContent(nodes).run();
            } else {
              editor.chain().focus().insertContent(nodes).run();
            }
            break;
          }

          case "insertNodes": {
            const { nodes, position = "cursor" } = args;
            const jsonNodes = nodes.map(nodeToJSON);

            if (position === "start") {
              editor.chain().focus("start").insertContent(jsonNodes).run();
            } else if (position === "end") {
              editor.chain().focus("end").insertContent(jsonNodes).run();
            } else {
              editor.chain().focus().insertContent(jsonNodes).run();
            }
            break;
          }

          case "setDocument": {
            const { paragraphs } = args;
            const doc: JSONContent = {
              type: "doc",
              content: paragraphsToJSON(paragraphs),
            };
            editor.commands.setContent(doc);
            break;
          }

          // ============ 局部修改层 ============

          case "replaceSelection": {
            const { content, asParagraphs = false } = args;
            const { from, to } = editor.state.selection;

            if (from === to) {
              result = { success: false, error: "没有选中任何内容" };
              break;
            }

            if (asParagraphs) {
              const paragraphs = content.split("\n\n").filter(Boolean);
              const nodes = paragraphsToJSON(paragraphs);
              editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent(nodes)
                .run();
            } else {
              editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent(content)
                .run();
            }
            break;
          }

          case "replaceBySearch": {
            const { search, replace, all = false } = args;

            if (all) {
              // 替换所有匹配项（从后往前替换，避免位置偏移问题）
              const matches = searchAllText(search).reverse();
              if (matches.length === 0) {
                result = {
                  success: false,
                  replaced: 0,
                  error: "未找到匹配内容",
                };
                break;
              }

              const tr = editor.state.tr;
              matches.forEach(({ from, to }) => {
                tr.replaceWith(from, to, editor.schema.text(replace));
              });
              editor.view.dispatch(tr);
              result = { success: true, replaced: matches.length };
            } else {
              // 只替换第一个匹配项
              const match = searchText(search);
              if (!match) {
                result = {
                  success: false,
                  replaced: 0,
                  error: "未找到匹配内容",
                };
                break;
              }

              editor
                .chain()
                .focus()
                .setTextSelection(match)
                .deleteSelection()
                .insertContent(replace)
                .run();
              result = { success: true, replaced: 1 };
            }
            break;
          }

          case "insertAtPosition": {
            const { position, content } = args;
            editor.commands.insertContentAt(position, content);
            break;
          }

          // ============ 辅助工具 ============

          case "focusEditor": {
            const { position = "keep" } = args;
            if (position === "start") {
              editor.commands.focus("start");
            } else if (position === "end") {
              editor.commands.focus("end");
            } else {
              editor.commands.focus();
            }
            break;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        window.electron.ipcRenderer.send(responseChannel, result);
      } catch (error: any) {
        console.error(`[TAOP] Error executing tool ${name}:`, error);
        window.electron.ipcRenderer.send(responseChannel, {
          success: false,
          error: error.message,
        });
      }
    };

    const removeListener = window.electron.ipcRenderer.on(
      "tool:execute",
      handleToolExecute
    );

    return () => {
      if (typeof removeListener === "function") {
        removeListener();
      } else {
        window.electron.ipcRenderer.removeAllListeners("tool:execute");
      }
    };
  }, [editor]);
};
