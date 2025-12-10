/**
 * Admonition 扩展
 * 支持 note, tip, warning, danger, info 类型
 * 输入 ::: 弹出选择菜单
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  ReactRenderer,
} from "@tiptap/react";
import { NodeViewProps } from "@tiptap/react";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import PinyinMatch from "pinyin-match";
import { lang } from "@/lib/locales/i18n";
import { useTranslation } from "react-i18next";
import { lockScroll, unlockScroll } from "@/lib/editor/scroll-lock";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    admonition: {
      setAdmonition: (type?: AdmonitionType) => ReturnType;
      toggleAdmonition: (type?: AdmonitionType) => ReturnType;
    };
  }
}

export type AdmonitionType = "note" | "tip" | "warning" | "danger" | "info";

export const ADMONITION_CONFIG: Record<
  AdmonitionType,
  {
    icon: React.ElementType;
    label: string;
    className: string;
    descriptionKey: string;
  }
> = {
  note: {
    icon: MessageCircle,
    label: "Note",
    descriptionKey: "common.admonition.noteDesc",
    className: "admonition-note",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    descriptionKey: "common.admonition.tipDesc",
    className: "admonition-tip",
  },
  info: {
    icon: Info,
    label: "Info",
    descriptionKey: "common.admonition.infoDesc",
    className: "admonition-info",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    descriptionKey: "common.admonition.warningDesc",
    className: "admonition-warning",
  },
  danger: {
    icon: AlertCircle,
    label: "Danger",
    descriptionKey: "common.admonition.dangerDesc",
    className: "admonition-danger",
  },
};

const AdmonitionComponent = ({ node }: NodeViewProps) => {
  const type = (node.attrs.type as AdmonitionType) || "note";
  const config = ADMONITION_CONFIG[type] || ADMONITION_CONFIG.note;
  const Icon = config.icon;

  return (
    <NodeViewWrapper className="my-3">
      <div className={cn("admonition", config.className)}>
        <div className="admonition-header" contentEditable={false}>
          <Icon className="admonition-icon" />
          <span className="admonition-label">{config.label}</span>
        </div>
        <NodeViewContent className="admonition-content" />
      </div>
    </NodeViewWrapper>
  );
};

// Admonition 选择菜单组件
interface AdmonitionMenuItem {
  type: AdmonitionType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const getAdmonitionMenuItems = (): AdmonitionMenuItem[] =>
  Object.entries(ADMONITION_CONFIG).map(([type, config]) => ({
    type: type as AdmonitionType,
    label: config.label,
    description: lang(config.descriptionKey),
    icon: config.icon,
  }));

interface AdmonitionMenuProps {
  items: AdmonitionMenuItem[];
  command: (item: AdmonitionMenuItem) => void;
}

interface AdmonitionMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const AdmonitionMenuComponent = forwardRef<
  AdmonitionMenuRef,
  AdmonitionMenuProps
>(({ items, command }, ref) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command]
  );

  const onKeyDown = useCallback(
    ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
    [items.length, selectedIndex, selectItem]
  );

  useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown]);

  const getIconColor = (type: AdmonitionType) => {
    switch (type) {
      case "note":
        return "text-zinc-500";
      case "tip":
        return "text-emerald-500";
      case "info":
        return "text-blue-500";
      case "warning":
        return "text-amber-500";
      case "danger":
        return "text-red-500";
    }
  };

  return (
    <div
      className="bg-background border border-border rounded-2xl overflow-hidden w-56 max-h-80 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
        {t("common.admonition.label")}
      </div>
      <div className="px-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.type}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-100 group outline-none",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-6 rounded-md transition-colors shrink-0",
                  getIconColor(item.type)
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-xs font-normal truncate block leading-tight",
                    isSelected ? "text-accent-foreground" : "text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

AdmonitionMenuComponent.displayName = "AdmonitionMenuComponent";

export const Admonition = Node.create({
  name: "admonition",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-type") || "note",
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-admonition="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-admonition": "true" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdmonitionComponent);
  },

  addCommands() {
    return {
      setAdmonition:
        (type: AdmonitionType = "note") =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleAdmonition:
        (type: AdmonitionType = "note") =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            return commands.lift(this.name);
          }
          return commands.wrapIn(this.name, { type });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Cmd+Backspace: 删除 admonition，保留内容
      "Mod-Backspace": () => {
        if (this.editor.isActive("admonition")) {
          return this.editor.commands.lift(this.name);
        }
        return false;
      },
      // Backspace: 在 admonition 开头时阻止删除
      Backspace: () => {
        if (!this.editor.isActive("admonition")) {
          return false;
        }

        const { state } = this.editor;
        const { selection } = state;
        const { $anchor, empty } = selection;

        // 如果有选区，允许正常删除内容
        if (!empty) {
          return false;
        }

        // 检查是否在开头
        const isAtStart = $anchor.parentOffset === 0;
        if (isAtStart) {
          // 检查是否是 admonition 内的第一个段落
          const depth = $anchor.depth;
          for (let d = depth; d > 0; d--) {
            const node = $anchor.node(d);
            if (node.type.name === "admonition") {
              const posInAdmonition = $anchor.pos - $anchor.start(d);
              // 如果在 admonition 最开头，阻止删除
              if (posInAdmonition <= 1) {
                return true;
              }
              break;
            }
          }
        }

        return false;
      },
      // Mod+Enter: 退出 admonition
      "Mod-Enter": () => {
        if (this.editor.isActive("admonition")) {
          // 在 admonition 后插入段落并聚焦
          return this.editor
            .chain()
            .focus()
            .command(({ tr, state }) => {
              const { selection } = state;
              const { $anchor } = selection;

              // 找到 admonition 节点
              for (let d = $anchor.depth; d > 0; d--) {
                const node = $anchor.node(d);
                if (node.type.name === "admonition") {
                  const endPos = $anchor.end(d);
                  // 在 admonition 后插入段落
                  const paragraph = state.schema.nodes.paragraph.create();
                  tr.insert(endPos + 1, paragraph);
                  // 移动光标到新段落
                  const { TextSelection } = require("@tiptap/pm/state");
                  tr.setSelection(
                    TextSelection.near(tr.doc.resolve(endPos + 2))
                  );
                  return true;
                }
              }
              return false;
            })
            .run();
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const nodeType = this.type;

    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("admonitionSuggestion"),
        char: ":::",
        items: ({ query }) => {
          const items = getAdmonitionMenuItems();
          if (!query) {
            return items;
          }
          return items.filter((item) => {
            const lowerQuery = query.toLowerCase();
            // 普通文本匹配
            if (
              item.label.toLowerCase().includes(lowerQuery) ||
              item.type.toLowerCase().includes(lowerQuery) ||
              item.description.toLowerCase().includes(lowerQuery)
            ) {
              return true;
            }
            // 拼音匹配
            const matchLabel = PinyinMatch.match(item.label, query);
            const matchDesc = PinyinMatch.match(item.description, query);
            return matchLabel !== false || matchDesc !== false;
          });
        },
        render: () => {
          let popup: TippyInstance[] | null = null;
          let component: ReactRenderer;

          return {
            onStart: (props) => {
              // 锁定主容器滚动，防止弹出菜单位置偏移
              lockScroll();

              component = new ReactRenderer(AdmonitionMenuComponent, {
                props: {
                  items: props.items,
                  command: (item: AdmonitionMenuItem) => {
                    props.editor
                      .chain()
                      .focus()
                      .deleteRange(props.range)
                      .wrapIn(nodeType, { type: item.type })
                      .run();
                    popup?.[0]?.hide();
                  },
                },
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                maxWidth: "none",
              });
            },

            onUpdate(props) {
              component.updateProps({
                items: props.items,
                command: (item: AdmonitionMenuItem) => {
                  props.editor
                    .chain()
                    .focus()
                    .deleteRange(props.range)
                    .wrapIn(nodeType, { type: item.type })
                    .run();
                  popup?.[0]?.hide();
                },
              });

              if (popup?.[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              }
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              const ref = component?.ref as AdmonitionMenuRef | null;
              return ref?.onKeyDown(props) || false;
            },

            onExit() {
              // 解锁滚动
              unlockScroll();

              popup?.[0]?.destroy();
              component?.destroy();
              popup = null;
            },
          };
        },
      }),
    ];
  },
});
