import {
  DEFAULT_TIPTAP_CONTENT,
  TiptapContent,
} from "@/components/editor/tiptap-types";
import { NovelChapterEditor } from "@/components/editor/NovelChapterEditor";
import { updateChapterById } from "@/hook/novel/useNovel";
import { memo, useCallback, useEffect } from "react";
import type { Chapter } from "@common/schema/novel";

/** Chapter编辑器 */
export const ChapterBodyEditor = memo(
  ({
    autoFocus,
    chapter,
    className,
  }: {
    autoFocus?: boolean;
    chapter: Chapter | null;
    className?: string;
  }) => {
    /**
     * 处理文档内容变化的回调函数
     * 直接调用 updateChapterById，它内部会处理防抖
     */
    const handleChange = useCallback(
      (content: TiptapContent) => {
        if (chapter) {
          updateChapterById(chapter.id, { body: content });
        }
      },
      [chapter]
    );

    useEffect(() => {
      /* 监听alt按键，阻止默认行为 */
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.altKey) {
          event.preventDefault();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    return (
      <NovelChapterEditor
        key={chapter?.id}
        autoFocus={autoFocus}
        value={chapter?.body || DEFAULT_TIPTAP_CONTENT}
        quickFocus
        onChange={handleChange}
        className={className}
      />
    );
  }
);

ChapterBodyEditor.displayName = "ChapterBodyEditor";
