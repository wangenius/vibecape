import { useEffect, useState, useCallback } from "react";

export type PaletteType = "command" | "docSearch" | null;

/**
 * 统一管理命令面板和文档搜索面板的开合状态
 * - Command+P: 打开文档搜索
 * - Command+Shift+P: 打开命令面板
 * - 两者互斥，不会同时打开
 */
export const usePalette = () => {
  const [activePalette, setActivePalette] = useState<PaletteType>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();

      // 检查是否按下 P 键
      if (key !== "p") return;

      // 检查是否有 Alt 键
      if (event.altKey) return;

      const isMeta = event.metaKey;
      const isCtrl = event.ctrlKey;
      const isShift = event.shiftKey;

      // 需要 Meta 或 Ctrl
      if (!isMeta && !isCtrl) return;

      // Meta+Ctrl 同时按下时忽略
      if (isMeta && isCtrl) return;

      event.preventDefault();

      if (isShift) {
        // Command+Shift+P 或 Ctrl+Shift+P -> 命令面板
        setActivePalette((prev) => (prev === "command" ? null : "command"));
      } else {
        // Command+P 或 Ctrl+P -> 文档搜索
        setActivePalette((prev) => (prev === "docSearch" ? null : "docSearch"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closePalette = useCallback(() => {
    setActivePalette(null);
  }, []);

  const openCommandPalette = useCallback(() => {
    setActivePalette("command");
  }, []);

  const openDocSearch = useCallback(() => {
    setActivePalette("docSearch");
  }, []);

  return {
    activePalette,
    setActivePalette,
    closePalette,
    openCommandPalette,
    openDocSearch,
    isCommandPaletteOpen: activePalette === "command",
    isDocSearchOpen: activePalette === "docSearch",
  };
};
