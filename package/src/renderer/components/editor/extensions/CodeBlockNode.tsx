/**
 * 自定义 CodeBlock 扩展
 * 使用 Shiki 进行语法高亮
 */

import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { NodeViewProps } from "@tiptap/react";
import { codeToHtml } from "shiki";
import { Check, Copy, ChevronDown } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  const [showLanguages, setShowLanguages] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  
  const language = node.attrs.language || "plaintext";
  const code = node.textContent || "";

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
          }).then((html) => {
            if (!cancelled) setHighlightedHtml(html);
          }).catch(() => {
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
      setShowLanguages(false);
    },
    [updateAttributes]
  );

  // 点击外部关闭语言选择器
  useEffect(() => {
    if (!showLanguages) return;
    const handleClick = () => setShowLanguages(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showLanguages]);

  return (
    <NodeViewWrapper className="relative my-3" data-type="codeBlock">
      <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border select-none"
          contentEditable={false}
        >
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLanguages(!showLanguages);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-mono">{language}</span>
              <ChevronDown className="size-3" />
            </button>
            {showLanguages && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors",
                      lang === language && "bg-accent"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content with Shiki Highlighting */}
        <div className="relative min-h-[3rem]">
          {/* 可编辑层 - 在底层 */}
          <NodeViewContent 
            className={cn(
              "block p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto outline-none",
              highlightedHtml ? "text-transparent caret-foreground selection:bg-primary/30" : "text-foreground"
            )}
          />
          {/* 语法高亮层 - 覆盖在上层 */}
          {highlightedHtml && (
            <div
              className="absolute inset-0 p-4 pointer-events-none overflow-hidden z-10"
              aria-hidden="true"
              contentEditable={false}
            >
              <div 
                className="[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!overflow-visible [&_code]:!text-sm [&_code]:!leading-relaxed [&_code]:!font-mono [&_code]:!whitespace-pre-wrap"
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
      // Backspace: 空代码块时删除整个块
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $anchor } = selection;
        
        // 检查是否在代码块内
        if (!this.editor.isActive("codeBlock")) {
          return false;
        }
        
        // 检查是否在代码块开头且代码块为空
        const isAtStart = $anchor.parentOffset === 0;
        const isEmpty = $anchor.parent.textContent === "";
        
        if (isAtStart && isEmpty) {
          // 删除代码块，替换为段落
          return this.editor.commands.toggleNode("codeBlock", "paragraph");
        }
        
        return false;
      },
      // Tab 缩进
      Tab: () => {
        if (this.editor.isActive("codeBlock")) {
          this.editor.commands.insertContent("  ");
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
