/**
 * AI Edit Popover 组件
 *
 * Cmd+K 触发的内联编辑浮层：
 * - 跟随选区位置显示
 * - 输入指令后执行编辑
 * - 支持流式生成
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AIEditPopoverProps {
  editor: Editor | null;
}

interface SelectionInfo {
  selection: string;
  from: number;
  to: number;
  context?: {
    before: string;
    after: string;
  };
}

export const AIEditPopover = ({ editor }: AIEditPopoverProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(
    null
  );
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 监听 AI 编辑触发事件
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<SelectionInfo>) => {
      setSelectionInfo(event.detail);
      setIsVisible(true);
      setInstruction("");
      setError(null);
      setIsLoading(false);

      // 计算弹窗位置（基于选区）
      if (editor) {
        const { from } = event.detail;
        const coords = editor.view.coordsAtPos(from);
        setPosition({
          top: coords.top - 50, // 在选区上方
          left: coords.left,
        });
      }

      // 聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

    const handleComplete = () => {
      setIsVisible(false);
      setIsLoading(false);
      setSelectionInfo(null);
    };

    const handleCancel = () => {
      setIsVisible(false);
      setIsLoading(false);
      setSelectionInfo(null);
    };

    const handleError = (event: CustomEvent<{ error: string }>) => {
      setError(event.detail.error);
      setIsLoading(false);
    };

    // 进入 diff 模式时隐藏输入框
    const handleDiff = () => {
      setIsVisible(false);
      setIsLoading(false);
    };

    window.addEventListener("ai:edit:trigger", handleTrigger as EventListener);
    window.addEventListener("ai:edit:complete", handleComplete);
    window.addEventListener("ai:edit:cancel", handleCancel);
    window.addEventListener("ai:edit:error", handleError as EventListener);
    window.addEventListener("ai:edit:diff", handleDiff);

    return () => {
      window.removeEventListener(
        "ai:edit:trigger",
        handleTrigger as EventListener
      );
      window.removeEventListener("ai:edit:complete", handleComplete);
      window.removeEventListener("ai:edit:cancel", handleCancel);
      window.removeEventListener("ai:edit:error", handleError as EventListener);
      window.removeEventListener("ai:edit:diff", handleDiff);
    };
  }, [editor]);

  const handleSubmit = useCallback(() => {
    if (!instruction.trim() || isLoading || !editor) return;

    setIsLoading(true);
    setError(null);

    // 执行 AI 编辑
    editor.commands.executeAIEdit(instruction);
  }, [instruction, isLoading, editor]);

  const handleCancel = useCallback(() => {
    if (editor) {
      editor.commands.cancelAIEdit();
    }
    setIsVisible(false);
  }, [editor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  if (!isVisible || !selectionInfo) return null;

  const truncatedSelection =
    selectionInfo.selection.length > 50
      ? selectionInfo.selection.slice(0, 50) + "..."
      : selectionInfo.selection;

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: Math.max(10, position.top),
        left: Math.max(10, Math.min(position.left, window.innerWidth - 350)),
      }}
    >
      <div className="bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[320px] max-w-[400px]">
        {/* 选中文本预览 */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {t("editor.aiEdit.editing", "编辑")}: "{truncatedSelection}"
          </span>
        </div>

        {/* 输入框 */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("editor.aiEdit.placeholder", "输入修改指令...")}
            disabled={isLoading}
            className={cn(
              "flex-1 bg-muted/50 rounded-md px-3 py-2 text-sm",
              "outline-none focus:ring-1 focus:ring-primary",
              "placeholder:text-muted-foreground/50",
              "disabled:opacity-50"
            )}
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="size-5 text-primary animate-spin shrink-0" />
          ) : (
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title={t("common.cancel", "取消")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* 错误提示 */}
        {error && <div className="mt-2 text-xs text-destructive">{error}</div>}

        {/* 快捷键提示 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/70">
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">
              Enter
            </kbd>{" "}
            {t("editor.aiEdit.submit", "提交")}
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>{" "}
            {t("editor.aiEdit.cancel", "取消")}
          </span>
        </div>
      </div>
    </div>
  );
};
