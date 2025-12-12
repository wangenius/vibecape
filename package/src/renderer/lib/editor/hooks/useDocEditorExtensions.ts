import { useMemo } from "react";
import { Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { SlashCommand } from "../extensions/SlashCommand";
import { createSlashMenuPlugin } from "../menus/SlashMenu";
import {
  DocAIPromptNode,
  DocAIPolishMark,
} from "../extensions/DocAIPromptNode";
import { AIDiffMark } from "../extensions/AIDiffMark";
import { AIDiffNode } from "../extensions/AIDiffNode";
import { CodeBlockNode } from "../extensions/CodeBlockNode";
import { InlineCode } from "../extensions/InlineCode";
import { Blockquote } from "../extensions/Blockquote";
import { Admonition } from "../extensions/Admonition";
import { Mention } from "../extensions/Mention";
import { ImageNode } from "../extensions/ImageNode";
import { LinkNode } from "../extensions/LinkNode";
import { CustomKeyboardExtension } from "../extensions/CustomKeyboardExtension";
import { TableExtension } from "../extensions/TableExtension";
import { HeadingPlaceholder } from "../extensions/HeadingPlaceholder";
import { TitleNode, CustomDocument } from "../extensions/TitleNode";
import { TFunction } from "i18next";
import { dispatchQuoteEvent } from "@/lib/events/quoteEvent";
import { useDocumentStore } from "@/hooks/stores/useDocumentStore";

type UseDocEditorExtensionsOptions = {
  t: TFunction;
  handleSaveRef: React.MutableRefObject<() => void>;
};

/**
 * 创建保存快捷键扩展
 */
const createSaveKeymapExtension = (
  handleSaveRef: React.MutableRefObject<() => void>
) =>
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
  });

/**
 * 创建引用快捷键扩展 (Mod-l)
 */
const createQuoteKeymapExtension = () =>
  Extension.create({
    name: "quoteKeymap",
    addKeyboardShortcuts() {
      return {
        "Mod-l": ({ editor }) => {
          const { from, to, empty } = editor.state.selection;
          if (empty) return false;

          const doc = editor.state.doc;
          const text = doc.textBetween(from, to, "\n");
          if (!text.trim()) return false;

          // 获取上下文
          const contextBefore = doc.textBetween(
            Math.max(0, from - 200),
            from,
            "\n"
          );
          const contextAfter = doc.textBetween(
            to,
            Math.min(doc.content.size, to + 200),
            "\n"
          );

          // 找到选区所在的段落
          let paragraph = "";
          let paragraphOffset = 0;
          doc.nodesBetween(from, to, (node, pos) => {
            if (
              node.type.name === "paragraph" ||
              node.type.name === "heading"
            ) {
              paragraph = node.textContent;
              paragraphOffset = from - pos - 1;
              return false;
            }
            return true;
          });

          const activeDoc = useDocumentStore.getState().activeDoc;
          dispatchQuoteEvent({
            text: text.trim(),
            docId: activeDoc?.id,
            docTitle: activeDoc?.title,
            position: { from, to },
            context: {
              before: contextBefore,
              after: contextAfter,
            },
            paragraph: paragraph || undefined,
            paragraphOffset: paragraph ? paragraphOffset : undefined,
          });

          return true;
        },
      };
    },
  });

/**
 * 获取编辑器扩展配置
 */
export const useDocEditorExtensions = ({
  t,
  handleSaveRef,
}: UseDocEditorExtensionsOptions) => {
  const slashMenuConfig = useMemo(() => createSlashMenuPlugin(t), [t]);

  const extensions = useMemo(
    () => [
      // 使用自定义 Document 节点，强制 title 节点在顶部
      CustomDocument,
      TitleNode,
      StarterKit.configure({
        // 禁用 document，使用我们的 CustomDocument
        document: false,
        hardBreak: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        link: false,
        underline: false,
      }),
      CodeBlockNode,
      InlineCode,
      Blockquote,
      Admonition,
      Mention,
      ImageNode,
      LinkNode,
      Placeholder.configure({
        placeholder: ({ node, editor, pos }) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level;
            return t(`common.settings.headingPlaceholder.h${level}`);
          }
          if (node.type.name === "paragraph") {
            // 检查父节点是否是表格单元格
            if (pos >= 0) {
              const $pos = editor.state.doc.resolve(pos);
              const parent = $pos.parent;
              if (
                parent &&
                (parent.type.name === "tableCell" ||
                  parent.type.name === "tableHeader")
              ) {
                return "";
              }
            }
            return t("common.settings.slashPlaceholder");
          }
          return "";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
        includeChildren: true,
        emptyNodeClass: "is-empty",
        emptyEditorClass: "is-editor-empty",
      }),
      HeadingPlaceholder.configure({
        getPlaceholder: (level: number) =>
          t(`common.settings.headingPlaceholder.h${level}`),
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ...TableExtension,
      DocAIPromptNode,
      DocAIPolishMark,
      AIDiffMark,
      AIDiffNode,
      SlashCommand.configure({
        suggestion: slashMenuConfig,
      }),
      CustomKeyboardExtension,
      createSaveKeymapExtension(handleSaveRef),
      createQuoteKeymapExtension(),
    ],
    [t, slashMenuConfig, handleSaveRef]
  );

  return extensions;
};
