import { Input } from "@/components/ui/input";
import { memo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export const TitleInput = memo(
  ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value === "") {
        inputRef.current?.focus();
      }
    }, [value]);

    // 处理 Cmd/Ctrl + Enter 键，聚焦到编辑器顶部
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          // 查找 ProseMirror 编辑器并聚焦到顶部
          const proseMirrorElement = document.querySelector<HTMLElement>(
            ".ProseMirror[contenteditable='true']"
          );
          if (proseMirrorElement) {
            proseMirrorElement.focus();
            // 将光标移动到顶部
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.selectNodeContents(proseMirrorElement);
              range.collapse(true); // true 表示折叠到开头
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      },
      []
    );

    return (
      <Input
        ref={inputRef}
        defaultValue={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="w-full text-4xl font-medium tracking-tight bg-transparent border-none 
          focus:bg-transparent hover:bg-transparent
          placeholder:text-muted-foreground/30 px-0 h-20"
        placeholder={t("common.settings.enterTitle")}
      />
    );
  }
);
