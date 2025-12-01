import { context } from "@/components/custom/ContextMenu";
import { Menu } from "@/components/ui/menu";
import { useNovelStore } from "@/hook/novel/useNovel";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { useCallback, useState } from "react";
import { PiPlus } from "react-icons/pi";
import { PopoverContext } from "./ChapterPopoverContext";
import { SelectionContext } from "./ChapterSelectionContext";
import { SortableChapterItem } from "./SortableChapterItem";
import { ChapterSelectionToolbar } from "./ChapterSelectionToolbar";

/** 章节目录 */
const ChapterContent = () => {
  const chapters = useNovelStore((state) => state?.chapters);
  const stories = useCosmos((state) => state?.stories);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [openPopover, setOpenPopover] = useState(false);

  const toggleChapterSelection = useCallback((id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id)
        ? prev.filter((chapterId) => chapterId !== id)
        : [...prev, id]
    );
  }, []);

  const isChapterSelected = useCallback(
    (id: string) => {
      return selectedChapters.includes(id);
    },
    [selectedChapters]
  );

  const clearSelection = useCallback(() => {
    setSelectedChapters([]);
    setSelectionMode(false);
  }, []);

  const handleAddChapter = () => {
    useNovelStore.getState().insertChapter();
  };

  const handleSelectChapter = (index: number) => {
    if (isSelectionMode) return;
    useNovelStore.getState().setCurrentChapterIndex(index);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    context({
      event: e,
      content: (close) => (
        <Menu
          items={[
            {
              label: "添加章节",
              icon: PiPlus,
              onClick: () => {
                handleAddChapter();
                close();
              },
            },
          ]}
        />
      ),
    });
  };

  if (!chapters) return null;
  return (
    <SelectionContext.Provider
      value={{
        isSelectionMode,
        setSelectionMode,
        selectedChapters,
        toggleChapterSelection,
        isChapterSelected,
        clearSelection,
      }}
    >
      <PopoverContext.Provider
        value={{ enabled: true, activePopover, setActivePopover }}
      >
        <div className="h-full flex flex-col">
          <ChapterSelectionToolbar
            isSelectionMode={isSelectionMode}
            selectedChapters={selectedChapters}
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
            clearSelection={clearSelection}
            onAddChapter={handleAddChapter}
          />

          <div
            onContextMenu={handleContextMenu}
            className="flex-1 w-full mt-2 min-h-0 overflow-y-auto"
          >
            <div className="min-w-0 h-full space-y-1 p-1">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  onClick={() => handleSelectChapter(index)}
                  className="transition-transform duration-200"
                >
                  <SortableChapterItem
                    stories={stories}
                    story={stories?.[chapter.story_id || ""]}
                    chapter={chapter}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContext.Provider>
    </SelectionContext.Provider>
  );
};

export { ChapterContent };
export { PopoverContext } from "./ChapterPopoverContext";
export { SelectionContext } from "./ChapterSelectionContext";
