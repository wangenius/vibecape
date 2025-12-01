/**
 * 润色 Diff 显示组件
 * 展示原文和润色后的对比
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Copy } from "lucide-react";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { diffWords, type Change } from "diff";

interface PolishDiffViewProps {
  originalText: string;
  polishedText: string;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

const DiffText = memo(({ changes }: { changes: Change[] }) => {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {changes.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              className="bg-green-500/20 text-green-700 dark:text-green-300"
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              className="bg-red-500/20 text-red-700 dark:text-red-300 line-through"
            >
              {part.value}
            </span>
          );
        }
        return (
          <span key={index} className="text-foreground">
            {part.value}
          </span>
        );
      })}
    </div>
  );
});

DiffText.displayName = "DiffText";

export const PolishDiffView = memo(
  ({
    originalText,
    polishedText,
    onAccept,
    onReject,
    className,
  }: PolishDiffViewProps) => {
    const changes = diffWords(originalText, polishedText);

    const handleCopy = useCallback(() => {
      navigator.clipboard.writeText(polishedText);
      toast.success("已复制润色后的内容");
    }, [polishedText]);

    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-popover shadow-lg p-4 space-y-3",
          className
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              AI 润色建议
            </span>
            <span className="text-xs text-muted-foreground/60">
              {polishedText.length} 字
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="复制润色内容"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Diff 内容 */}
        <div className="rounded-md bg-muted/50 p-3 max-h-[300px] overflow-y-auto">
          <DiffText changes={changes} />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="h-8 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            拒绝
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onAccept}
            className="h-8 text-xs"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            应用
          </Button>
        </div>
      </div>
    );
  }
);

PolishDiffView.displayName = "PolishDiffView";
