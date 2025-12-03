/**
 * 自定义 CodeBlock 扩展
 * 使用 Shiki 进行语法高亮
 */

import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import { NodeViewProps } from "@tiptap/react";
import { codeToHtml } from "shiki";
import { Check, Copy } from "lucide-react";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 常用语言列表
const LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "html",
  "css",
  "scss",
  "json",
  "yaml",
  "markdown",
  "bash",
  "shell",
  "sql",
  "graphql",
  "dockerfile",
];

const CodeBlockComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const [copied, setCopied] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const language = node.attrs.language || "plaintext";
  const code = node.textContent || "";

  // 过滤语言列表
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return LANGUAGES;
    const query = searchQuery.toLowerCase();
    return LANGUAGES.filter((lang) => lang.toLowerCase().includes(query));
  }, [searchQuery]);

  // 使用 Shiki 进行语法高亮
  useEffect(() => {
    if (!code.trim()) {
      setHighlightedHtml("");
      return;
    }

    let cancelled = false;
    const langToUse = language === "plaintext" ? "text" : language;

    codeToHtml(code, {
      lang: langToUse,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false, // 使用 CSS 变量切换主题
    })
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      })
      .catch((err) => {
        console.warn("Shiki highlight error:", err);
        // 如果语言不支持，使用 text
        if (!cancelled) {
          codeToHtml(code, {
            lang: "text",
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          })
            .then((html) => {
              if (!cancelled) setHighlightedHtml(html);
            })
            .catch(() => {
              // 最后的回退：显示纯文本
              if (!cancelled) setHighlightedHtml("");
            });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang });
      setLanguageOpen(false);
      setSearchQuery("");
      setHighlightedIndex(0);
    },
    [updateAttributes]
  );

  // 处理搜索框键盘事件
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredLanguages.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredLanguages.length > 0) {
          handleLanguageChange(filteredLanguages[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        setLanguageOpen(false);
        setSearchQuery("");
        setHighlightedIndex(0);
      }
    },
    [filteredLanguages, highlightedIndex, handleLanguageChange]
  );

  // 当搜索结果变化时重置高亮索引
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (languageOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  }, [languageOpen]);

  return (
    <NodeViewWrapper className="relative my-2" data-type="codeBlock">
      <div className="rounded-lg bg-muted overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between pl-4 pr-2 pt-2 select-none"
          contentEditable={false}
        >
          {/* Language Selector */}
          <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80 hover:text-foreground transition-colors uppercase tracking-wider">
                {language}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="p-1 w-36"
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索语言..."
                className="w-full px-2 py-1 mb-1 text-[11px] bg-transparent border-b border-border outline-none placeholder:text-muted-foreground/50"
              />
              <div className="max-h-44 overflow-y-auto scrollbar-hide">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang, index) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={cn(
                        "block w-full px-2 py-1 text-left text-[11px] font-mono rounded transition-colors",
                        index === highlightedIndex
                          ? "bg-foreground/10 text-foreground"
                          : lang === language
                            ? "text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {lang}
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-1 text-[11px] text-muted-foreground/50">
                    无匹配结果
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>

        {/* Code Content */}
        <div
          className="relative whitespace-pre-wrap"
          style={{
            fontFamily:
              "'Fira Code', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            fontSize: "14px",
            lineHeight: "22px",
          }}
        >
          <NodeViewContent
            className={cn(
              "block px-4 py-4 overflow-x-auto outline-none",
              highlightedHtml
                ? "text-transparent caret-foreground selection:bg-primary/20"
                : "text-foreground/90"
            )}
          />
          {/* Placeholder */}
          {!code && (
            <div
              className="absolute inset-0 px-4 py-4 pointer-events-none text-muted-foreground/50"
              contentEditable={false}
            >
              Enter code...
            </div>
          )}
          {highlightedHtml && (
            <div
              className="absolute inset-0 px-4 py-4 pointer-events-none overflow-hidden"
              aria-hidden="true"
              contentEditable={false}
            >
              <div
                className="code-block-highlight"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const CodeBlockNode = Node.create({
  name: "codeBlock",

  group: "block",

  content: "text*",

  marks: "",

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: "plaintext",
        parseHTML: (element) => {
          const classAttr = element.firstElementChild?.getAttribute("class");
          const match = classAttr?.match(/language-(\w+)/);
          return match?.[1] || "plaintext";
        },
        renderHTML: (attributes) => ({
          class: `language-${attributes.language}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ["code", {}, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
      // Cmd+Backspace: 将代码块转换为普通段落
      "Mod-Backspace": () => {
        if (this.editor.isActive("codeBlock")) {
          return this.editor.commands.toggleNode("codeBlock", "paragraph");
        }
        return false;
      },
      // Backspace: 在代码块开头时阻止删除代码块
      Backspace: () => {
        // 检查是否在代码块内
        if (!this.editor.isActive("codeBlock")) {
          return false;
        }

        const { state } = this.editor;
        const { selection } = state;
        const { $anchor, empty } = selection;

        // 如果有选区，允许正常删除内容
        if (!empty) {
          return false;
        }

        // 检查是否在代码块开头（无选区时）
        // 在代码块开头时，阻止删除代码块
        const isAtStart = $anchor.parentOffset === 0;
        if (isAtStart) {
          return true;
        }

        return false;
      },
      // Tab 缩进
      Tab: () => {
        if (this.editor.isActive("codeBlock")) {
          this.editor.commands.insertContent("    ");
          return true;
        }
        return false;
      },
      // Shift+Tab 取消缩进
      "Shift-Tab": () => {
        if (this.editor.isActive("codeBlock")) {
          return true;
        }
        return false;
      },
      // 退出代码块
      "Mod-Enter": () => {
        if (this.editor.isActive("codeBlock")) {
          return this.editor.commands.exitCode();
        }
        return false;
      },
      // Enter 在末尾时可以退出代码块
      Enter: () => {
        if (!this.editor.isActive("codeBlock")) {
          return false;
        }

        const { state } = this.editor;
        const { selection } = state;
        const { $anchor } = selection;
        const text = $anchor.parent.textContent;

        // 如果以两个换行符结尾，退出代码块
        if (text.endsWith("\n\n")) {
          // 删除多余的换行符并退出
          this.editor.commands.command(({ tr }) => {
            const pos = $anchor.pos;
            tr.delete(pos - 2, pos);
            return true;
          });
          return this.editor.commands.exitCode();
        }

        return false;
      },
    };
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
    };
  },

  addInputRules() {
    return [
      // ```language 或 ``` 触发代码块
      textblockTypeInputRule({
        find: /^```([a-z]*)?[\s\n]$/,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1] || "plaintext",
        }),
      }),
    ];
  },
});
