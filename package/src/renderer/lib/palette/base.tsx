import { useCallback, useEffect, useState } from "react";
import { Command, CommandInput, CommandList } from "@/components/ui/command";

interface PaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export const Palette = ({
  open,
  onOpenChange,
  placeholder = "输入搜索...",
  children,
}: PaletteProps) => {
  const [search, setSearch] = useState("");

  // 点击背景关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  // 重置搜索
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center pt-[15vh]"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg h-fit">
        <Command className="rounded-lg border border-border shadow-sm bg-popover" loop>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList className="p-1">{children}</CommandList>
        </Command>
      </div>
    </div>
  );
};
