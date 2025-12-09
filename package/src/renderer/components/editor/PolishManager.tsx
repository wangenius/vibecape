/**
 * 润色管理组件
 * 管理当前编辑器中的润色请求和结果展示
 */

import { memo, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { PolishDiffView } from "./PolishDiffView";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { 
  usePolishStore, 
  type PolishRequest 
} from "@/hooks/stores/usePolishStore";

interface PolishManagerProps {
  editor: Editor | null;
}

export const PolishManager = memo(({ editor }: PolishManagerProps) => {
  const { t } = useTranslation();
  const activePolish = usePolishStore((state) => state.activePolish);
  const setActivePolish = usePolishStore((state) => state.setActivePolish);
  const updatePolish = usePolishStore((state) => state.updatePolish);
  const registerStartPolish = usePolishStore((state) => state.registerStartPolish);

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
          throw new Error(t("common.polish.interfaceNotEnabled"));
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
                updatePolish((prev) =>
                  prev
                    ? {
                        ...prev,
                        polishedText,
                        status: "loading",
                      }
                    : null
                );
              } else if (payload?.type === "end") {
                window.electron?.ipcRenderer.removeAllListeners(
                  result.channel!
                );
                updatePolish((prev) =>
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
                window.electron?.ipcRenderer.removeAllListeners(
                  result.channel!
                );
                updatePolish((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "error",
                        error: payload.message || t("common.polish.failed"),
                      }
                    : null
                );
                reject(new Error(payload.message || t("common.polish.failed")));
              }
            };
            window.electron?.ipcRenderer.on(result.channel, handler);
          });
        }
      } catch (error) {
        console.error("润色失败:", error);
        updatePolish((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : t("common.polish.unknownError"),
              }
            : null
        );
      }
    },
    [editor, setActivePolish, updatePolish, t]
  );

  // 注册 startPolish 到 store，供外部调用；组件卸载时清除
  useEffect(() => {
    registerStartPolish(startPolish);
    return () => {
      registerStartPolish(null);
      setActivePolish(null);
    };
  }, [startPolish, registerStartPolish, setActivePolish]);

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
  }, [editor, activePolish, setActivePolish]);

  // 拒绝润色结果
  const handleReject = useCallback(() => {
    setActivePolish(null);
  }, [setActivePolish]);

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
            <span>{t("common.polish.polishing")}</span>
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
            {t("common.polish.failed")}：{activePolish.error}
          </div>
        </div>
      )}
    </div>
  );
});

PolishManager.displayName = "PolishManager";

// 导出类型
export type { PolishRequest };
