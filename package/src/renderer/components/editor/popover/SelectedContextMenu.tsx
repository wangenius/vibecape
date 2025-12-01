import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import React, { useCallback, useEffect, useRef } from "react";
import { PiArrowsCounterClockwise, PiCopy } from "react-icons/pi";
import { TbMenuDeep, TbPencil, TbSignature } from "react-icons/tb";
import { toast } from "sonner";
import { Portal } from ".";

export const SelectedContextMenu = ({
  position,
  onClose,
}: {
  position: { x: number; y: number };
  onClose: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // 直接使用浏览器选中的文本
  const selectedText = window.getSelection()?.toString() || "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Click event triggered");
    console.log("Selected text:", selectedText);

    try {
      navigator.clipboard.writeText(selectedText).then(() => {
        toast.success("复制成功");
      });
      onClose();
    } catch (err) {
      toast.error("复制失败");
    }
  };

  const handleSynonymReplace = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const getContext = useCallback(() => {
    let before = "";
    let after = "";

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return [before, after];
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // 获取整个编辑器的文本
      const editorElement =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element);

      const editorRoot = editorElement?.closest('[contenteditable="true"]');
      if (!editorRoot) return [before, after];

      const fullText = editorRoot.textContent || "";
      const selectedText = selection.toString();

      // 找到选中文本在全文中的位置
      const selectedIndex = fullText.indexOf(selectedText);
      if (selectedIndex === -1) return [before, after];

      // 获取选区前的最多120个字符
      const beforeStart = Math.max(0, selectedIndex - 120);
      before = fullText.slice(beforeStart, selectedIndex);

      // 获取选区后的最多120个字符
      const afterEnd = Math.min(
        fullText.length,
        selectedIndex + selectedText.length + 120
      );
      after = fullText.slice(selectedIndex + selectedText.length, afterEnd);
    } catch (e) {
      console.log("获取上下文错误", e);
    }

    return [before, after];
  }, []);

  const expand_submit = async () => {
    onClose();
    if (selectedText) {
      const context = getContext();
      console.log("Context:", context);
    }
  };
  const embellish_submit = async () => {
    onClose();
    if (selectedText) {
      const context = getContext();
      console.log("Context:", context);
    }
  };
  const rewrite_submit = async () => {
    onClose();
    if (selectedText) {
      const context = getContext();
      console.log("Context:", context);
    }
  };

  return (
    <Portal>
      <div
        className="border-none shadow-none z-100000"
        ref={menuRef}
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
        }}
      >
        <Menu>
          <Button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleClick}
            className="w-full flex items-center text-sm gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
          >
            <PiCopy />
            <span className="text-xs flex-1">复制</span>
          </Button>
          <Button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-full flex items-center text-sm gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
            onClick={expand_submit}
          >
            <TbMenuDeep className="h-3.5 w-3.5" />
            <span className="text-xs flex-1">扩写</span>
          </Button>

          <Button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-full flex items-center text-sm gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
            onClick={embellish_submit}
          >
            <TbSignature className="h-3.5 w-3.5" />
            <span className="text-xs flex-1">润色</span>
          </Button>

          <Button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-full flex items-center text-sm gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
            onClick={rewrite_submit}
          >
            <TbPencil className="h-3.5 w-3.5" />
            <span className="text-xs flex-1">改写</span>
          </Button>
          {selectedText.length < 6 && (
            <Button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={handleSynonymReplace}
              className="w-full flex items-center text-sm gap-2 px-2 py-1 hover:bg-muted cursor-pointer"
            >
              <PiArrowsCounterClockwise />
              近义词替换
            </Button>
          )}
        </Menu>
      </div>
    </Portal>
  );
};
