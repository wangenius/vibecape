/**
 * 润色管理组件
 * 管理当前编辑器中的润色请求和结果展示
 */

import { memo, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { PolishDiffView } from "./PolishDiffView";
import { Loader2 } from "lucide-react";

interface PolishRequest {
  id: string;
  originalText: string;
  requirement: string;
  position: { top: number; left: number };
  selectionRange: { from: number; to: number };
}

interface PolishResult extends PolishRequest {
  polishedText: string;
  status: "loading" | "success" | "error";
  error?: string;
}

interface PolishManagerProps {
  editor: Editor | null;
}

export const PolishManager = memo(({ editor }: PolishManagerProps) => {
  const [activePolish, setActivePolish] = useState<PolishResult | null>(null);

  // 开始润色请求
  const startPolish = useCallback(
    async (request: PolishRequest) => {
      if (!editor) return;

      // 设置加载状态
      setActivePolish({
        ...request,
        polishedText: "",
        status: "loading",
      });

      try {
        // 调用润色 API（兼容缺失场景）
        const aiApi = (window as any).api?.ai;
        if (!aiApi?.optimiseStart) {
          throw new Error("AI 润色接口未启用");
        }

        const result = await aiApi.optimiseStart({
          text: request.originalText,
          extra: request.requirement,
        });

        let polishedText = "";

        // 监听流式响应
        if (result.channel) {
          await new Promise<void>((resolve, reject) => {
            const handler = (_e: unknown, payload: any) => {
              if (payload?.type === "text-delta") {
                polishedText += payload.text || "";
                setActivePolish((prev) =>
                  prev
                    ? {
                        ...prev,
                        polishedText,
                        status: "loading",
                      }
                    : null
                );
              } else if (payload?.type === "end") {
                window.electron?.ipcRenderer.removeAllListeners(result.channel!);
                setActivePolish((prev) =>
                  prev
                    ? {
                        ...prev,
                        polishedText,
                        status: "success",
                      }
                    : null
                );
                resolve();
              } else if (payload?.type === "error") {
                window.electron?.ipcRenderer.removeAllListeners(result.channel!);
                setActivePolish((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "error",
                        error: payload.message || "润色失败",
                      }
                    : null
                );
                reject(new Error(payload.message || "润色失败"));
              }
            };
            window.electron?.ipcRenderer.on(result.channel, handler);
          });
        }
      } catch (error) {
        console.error("润色失败:", error);
        setActivePolish((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                error: error instanceof Error ? error.message : "未知错误",
              }
            : null
        );
      }
    },
    [editor]
  );

  // 应用润色结果
  const handleAccept = useCallback(() => {
    if (!editor || !activePolish || activePolish.status !== "success") return;

    const { from, to } = activePolish.selectionRange;
    const { polishedText } = activePolish;

    // 替换选中的文本
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(polishedText)
      .run();

    // 清除润色结果
    setActivePolish(null);
  }, [editor, activePolish]);

  // 拒绝润色结果
  const handleReject = useCallback(() => {
    setActivePolish(null);
  }, []);

  // 对外暴露方法
  (window as any).__polishManager = {
    startPolish,
  };

  if (!activePolish) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        top: `${activePolish.position.top + 10}px`,
        left: `${activePolish.position.left}px`,
      }}
    >
      {activePolish.status === "loading" ? (
        <div className="rounded-lg border border-border bg-popover shadow-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI 正在润色中...</span>
          </div>
          {activePolish.polishedText && (
            <div className="mt-2 text-sm text-foreground/80 max-w-[400px]">
              {activePolish.polishedText}
            </div>
          )}
        </div>
      ) : activePolish.status === "success" ? (
        <PolishDiffView
          originalText={activePolish.originalText}
          polishedText={activePolish.polishedText}
          onAccept={handleAccept}
          onReject={handleReject}
          className="max-w-[500px]"
        />
      ) : (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="text-sm text-destructive-foreground">
            润色失败：{activePolish.error}
          </div>
        </div>
      )}
    </div>
  );
});

PolishManager.displayName = "PolishManager";

// 导出启动润色的辅助函数
export const startPolishRequest = (request: PolishRequest) => {
  if ((window as any).__polishManager?.startPolish) {
    (window as any).__polishManager.startPolish(request);
  }
};
