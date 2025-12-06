/**
 * AI Diff Toolbar 组件
 *
 * 当文档中存在 AI diff 时，在编辑器顶部显示固定工具栏
 * 提供"接受全部"和"拒绝全部"操作
 */

import { useState, useEffect, useCallback, memo } from "react";
import { Editor } from "@tiptap/react";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AIDiffToolbarProps {
  editor: Editor | null;
}

/** 检查文档中是否存在 AI diff */
const hasDiffs = (editor: Editor | null): boolean => {
  if (!editor) return false;

  let found = false;
  editor.state.doc.descendants((node) => {
    if (found || !node.isText) return;
    node.marks.forEach((mark) => {
      if (mark.type.name === "aiDiff") {
        found = true;
      }
    });
  });

  return found;
};

/** 获取 diff 数量 */
const getDiffCount = (editor: Editor | null): number => {
  if (!editor) return 0;

  const diffIds = new Set<string>();
  editor.state.doc.descendants((node) => {
    if (!node.isText) return;
    node.marks.forEach((mark) => {
      if (mark.type.name === "aiDiff" && mark.attrs.diffId) {
        diffIds.add(mark.attrs.diffId);
      }
    });
  });

  return diffIds.size;
};

export const AIDiffToolbar = memo(({ editor }: AIDiffToolbarProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [diffCount, setDiffCount] = useState(0);

  // 监听文档变化，检查是否有 diff
  useEffect(() => {
    if (!editor) return;

    const updateVisibility = () => {
      const visible = hasDiffs(editor);
      setIsVisible(visible);
      if (visible) {
        setDiffCount(getDiffCount(editor));
      }
    };

    // 初始检查
    updateVisibility();

    // 监听文档更新
    editor.on("update", updateVisibility);

    // 监听 diff 相关事件
    const handleDiffChange = () => {
      setTimeout(updateVisibility, 50);
    };

    window.addEventListener("ai:diff:created", handleDiffChange);
    window.addEventListener("ai:diff:accepted", handleDiffChange);
    window.addEventListener("ai:diff:rejected", handleDiffChange);
    window.addEventListener("ai:diff:allAccepted", handleDiffChange);
    window.addEventListener("ai:diff:allRejected", handleDiffChange);

    return () => {
      editor.off("update", updateVisibility);
      window.removeEventListener("ai:diff:created", handleDiffChange);
      window.removeEventListener("ai:diff:accepted", handleDiffChange);
      window.removeEventListener("ai:diff:rejected", handleDiffChange);
      window.removeEventListener("ai:diff:allAccepted", handleDiffChange);
      window.removeEventListener("ai:diff:allRejected", handleDiffChange);
    };
  }, [editor]);

  const handleAcceptAll = useCallback(() => {
    if (editor) {
      editor.commands.acceptAllAIDiffs();
    }
  }, [editor]);

  const handleRejectAll = useCallback(() => {
    if (editor) {
      editor.commands.rejectAllAIDiffs();
    }
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-40 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <Sparkles className="size-4" />
          <span>
            {t("editor.aiEdit.pendingChanges", "{{count}} pending AI changes", {
              count: diffCount,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 接受全部 */}
          <button
            onClick={handleAcceptAll}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
              "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400",
              "border border-green-500/20 transition-colors"
            )}
          >
            <Check className="size-3.5" />
            {t("editor.aiEdit.acceptAll", "Accept All")}
          </button>

          {/* 拒绝全部 */}
          <button
            onClick={handleRejectAll}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
              "bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400",
              "border border-red-500/20 transition-colors"
            )}
          >
            <X className="size-3.5" />
            {t("editor.aiEdit.rejectAll", "Reject All")}
          </button>
        </div>
      </div>
    </div>
  );
});

AIDiffToolbar.displayName = "AIDiffToolbar";
