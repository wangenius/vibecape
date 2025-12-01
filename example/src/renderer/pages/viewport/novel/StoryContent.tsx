import { FilterSelector } from "@/components/custom/FilterSelector";
import { updateChapterByIndex } from "@/hook/novel/useNovel";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { TbScript } from "react-icons/tb";
import { Story } from "@common/schema";
import { StoryBodyEditor } from "@/components/cosmos/story/StoryBodyEditor";

interface StoryContentProps {
  story: Story;
  chapterIndex: number;
}

export const StoryContent = ({ story, chapterIndex }: StoryContentProps) => {
  const stories = useCosmos((state) => state?.stories);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="space-y-4 p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1">
          <TbScript className="h-4 w-4" />
          <h3 className="font-medium text-sm line-clamp-1">{story.name}</h3>
        </div>
        <FilterSelector
          trigger={
            <small className="text-muted-foreground/80 text-xs cursor-pointer hover:text-foreground transition-colors flex-none">
              切换情节
            </small>
          }
          items={
            stories
              ? Object.values(stories).map((story) => ({
                  id: story.id,
                  name: story.name,
                }))
              : []
          }
          align="end"
          onDelete={() => {
            updateChapterByIndex(chapterIndex, {
              story_id: undefined,
            });
          }}
          onSelect={(story) => {
            updateChapterByIndex(chapterIndex, {
              story_id: story.id,
            });
          }}
        />
      </div>
      <StoryBodyEditor story_id={story.id} />
    </div>
  );
};
