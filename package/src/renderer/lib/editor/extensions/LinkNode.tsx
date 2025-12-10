/**
 * Link 扩展
 * 内联链接节点，默认显示"链接"文字，点击弹出 Popover 编辑
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useState, useCallback, useRef, useEffect } from "react";
import { Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const titleRef = useRef<HTMLSpanElement>(null);
  const hasInitialized = useRef(false);

  const displayText = title || "链接";
  const isSelected = props.selected;

  // 新插入的节点，自动选中标题文字
  useEffect(() => {
    if (isNew && !hasInitialized.current && titleRef.current) {
      hasInitialized.current = true;
      // 延迟执行，确保 DOM 已渲染
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
          // 选中所有文字
          const range = document.createRange();
          range.selectNodeContents(titleRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        // 移除 isNew 标记
        props.updateAttributes({ isNew: false });
      }, 0);
    }
  }, [isNew, props]);

  // 打开 popover 时聚焦
  useEffect(() => {
    if (open && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 0);
    }
  }, [open]);

  // 处理 URL 提交
  const handleUrlSubmit = useCallback(() => {
    const trimmedUrl = urlInput.trim();
    
    let finalUrl = trimmedUrl;
    if (trimmedUrl && !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      finalUrl = `https://${trimmedUrl}`;
    }

    props.updateAttributes({ href: finalUrl || null });
    setOpen(false);
  }, [urlInput, props]);

  // URL 键盘事件
  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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

  // 标题编辑 - 直接在 contentEditable 中编辑
  const handleTitleBlur = useCallback(() => {
    const newTitle = titleRef.current?.textContent?.trim() || "链接";
    props.updateAttributes({ title: newTitle });
  }, [props]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleRef.current?.blur();
    }
  }, []);

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-center"
      data-type="link-node"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-medium transition-all cursor-text select-none mx-0.5 text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 hover:bg-blue-100/80 dark:hover:bg-blue-500/20 ${
              isSelected ? "bg-blue-200/80 dark:bg-blue-500/30 ring-1 ring-blue-400/50" : ""
            }`}
          >
            <Link2 className="size-3 mr-1 opacity-60" />
            <span
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="outline-none min-w-[1ch]"
            >
              {displayText}
            </span>
          </span>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-2" 
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
              确定
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
        tag: 'div[data-type="link-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "link-node" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkComponent);
  },

  addCommands() {
    return {
      setLinkNode:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      insertLinkPlaceholder:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { href: null, title: null },
          });
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
