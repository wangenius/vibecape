/**
 * Link 扩展
 * 内联链接节点，默认显示"链接"文字，点击弹出 Popover 编辑
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// URL 正则
const URL_REGEX = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+[^\s]*$/i;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkNode: {
      setLinkNode: (options: { href: string; title?: string; isNew?: boolean }) => ReturnType;
      insertLinkPlaceholder: () => ReturnType;
    };
  }
}

// 链接组件 - 参考 MentionNode 风格
function LinkComponent(props: any) {
  const { href, title, isNew } = props.node.attrs;
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(href || "");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [isModHover, setIsModHover] = useState(false);
  const hasMigratedLegacyTitle = useRef(false);

  const isTextEmpty = props.node.content.size === 0;

  // 打开 popover 时聚焦
  useEffect(() => {
    if (open && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (open) return;
    setUrlInput(href || "");
  }, [href, open]);

  useEffect(() => {
    if (hasMigratedLegacyTitle.current) return;
    if (!isTextEmpty) return;
    if (!title) return;
    const pos = typeof props.getPos === "function" ? props.getPos() : null;
    if (typeof pos !== "number") return;

    hasMigratedLegacyTitle.current = true;
    props.editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        tr.insertText(String(title), pos + 1);
        if (dispatch) dispatch(tr);
        return true;
      })
      .run();
  }, [isTextEmpty, props.editor, props.getPos, title]);

  useEffect(() => {
    if (!isNew) return;
    const pos = typeof props.getPos === "function" ? props.getPos() : null;
    if (typeof pos !== "number") return;
    const { state, view } = props.editor;
    const nodeSize = props.node.nodeSize;
    const from = pos + 1;
    const to = Math.max(from, pos + nodeSize - 1);
    const tr = state.tr.setSelection(TextSelection.create(state.doc, from, to));
    view.dispatch(tr);
    setTimeout(() => props.updateAttributes({ isNew: false }), 0);
  }, [isNew, props.editor, props.getPos, props.node.nodeSize, props.updateAttributes]);

  const normalizeUrl = useCallback((raw: string) => {
    const trimmedUrl = raw.trim();
    if (!trimmedUrl) return "";
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  }, []);

  const openLink = useCallback(
    (raw: string) => {
      const finalUrl = normalizeUrl(raw);
      if (!finalUrl) return;
      window.open(finalUrl, "_blank");
    },
    [normalizeUrl]
  );

  // 处理 URL 提交
  const handleUrlSubmit = useCallback(() => {
    const finalUrl = normalizeUrl(urlInput);
    props.updateAttributes({ href: finalUrl || null });
    setOpen(false);
  }, [normalizeUrl, urlInput, props]);

  // URL 键盘事件
  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "a" || e.key === "A") && (e.metaKey || e.ctrlKey)) {
        e.stopPropagation();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleUrlSubmit();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setUrlInput(href || "");
      }
    },
    [handleUrlSubmit, href]
  );

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-baseline"
      data-type="link-node"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span tabIndex={-1} aria-hidden className="sr-only" />
        </PopoverTrigger>

        <PopoverAnchor asChild>
          <span
            onMouseMove={(e) => setIsModHover(e.metaKey || e.ctrlKey)}
            onMouseLeave={() => setIsModHover(false)}
            onMouseDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && href) {
                e.preventDefault();
                e.stopPropagation();
                openLink(href);
              }
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className={`min-w-[1ch] underline underline-offset-2 decoration-current/30 text-muted-foreground ${
              isModHover && href ? "cursor-pointer" : "cursor-text"
            }`}
          >
            <NodeViewContent as="span" />
            {isTextEmpty ? (title || "链接") : null}
          </span>
        </PopoverAnchor>

        <PopoverContent
          className="w-72 p-2"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <Input
              ref={urlInputRef}
              type="text"
              placeholder="https://example.com"
              value={urlInput}
              onValueChange={setUrlInput}
              onKeyDown={handleUrlKeyDown}
              className="h-8 flex-1"
            />
            <button
              onClick={handleUrlSubmit}
              className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded shrink-0 transition-colors"
            >
              保存
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

export const LinkNode = Node.create({
  name: "linkNode",

  group: "inline",

  inline: true,

  selectable: false,

  content: "text*",

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: (attributes) => ({
          href: attributes.href,
        }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title") || element.textContent,
        renderHTML: (attributes) => ({
          title: attributes.title,
        }),
      },
      isNew: {
        default: false,
        parseHTML: () => false,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="link-node"]',
      },
      {
        tag: 'div[data-type="link-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "link-node" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkComponent);
  },

  addCommands() {
    return {
      setLinkNode:
        (options) =>
        ({ state, dispatch }) => {
          const { from, to } = state.selection;
          const text = state.schema.text(options.title || "链接");
          const node = state.schema.nodes[this.name].create(
            { ...options, title: options.title || null, isNew: true },
            text
          );

          let tr = state.tr.replaceRangeWith(from, to, node);
          tr = tr.setSelection(
            TextSelection.create(tr.doc, from + 1, from + node.nodeSize - 1)
          );

          if (dispatch) dispatch(tr);
          return true;
        },
      insertLinkPlaceholder:
        () =>
        ({ state, dispatch }) => {
          const { from, to } = state.selection;
          const text = state.schema.text("链接");
          const node = state.schema.nodes[this.name].create(
            { href: null, title: null, isNew: true },
            text
          );

          let tr = state.tr.replaceRangeWith(from, to, node);
          tr = tr.setSelection(
            TextSelection.create(tr.doc, from + 1, from + node.nodeSize - 1)
          );

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  // 粘贴链接时自动插入链接节点
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("linkNodePaste"),
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData("text/plain")?.trim();
            if (!text) return false;

            // 检查是否是 URL
            if (URL_REGEX.test(text)) {
              event.preventDefault();
              
              // 确保有协议
              const href = text.startsWith("http://") || text.startsWith("https://")
                ? text
                : `https://${text}`;
              
              // 插入链接节点，title 默认为 "链接"，标记为新节点
              this.editor.chain().focus().setLinkNode({ href, title: "链接", isNew: true }).run();
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
