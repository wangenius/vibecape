import { ROLLBACK_NAME } from "@common/lib/const";
import { dialog } from "@/components/custom/DialogModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memo, useEffect, useMemo, useState } from "react";
import { TbScript, TbTrash } from "react-icons/tb";
import { StoryBodyEditor } from "./StoryBodyEditor";
import { TimelineSpace } from "./TimelineSpace";
import { useCosmos } from "@/hook/cosmos/useCosmos";

const StoryTitle = memo(function StoryTitle({ story }: { story: any }) {
  const { name } = story;
  return (
    <input
      key={story.id} // 确保切换story时重置输入框
      autoFocus={!name}
      placeholder={ROLLBACK_NAME.STORY}
      defaultValue={name}
      className="text-2xl font-semibold h-10 border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent w-full outline-none"
      onChange={(e) =>
        useCosmos.getState().updateStory(story.id, { name: e.target.value })
      }
    />
  );
});

export const StoryCard = memo(function StoryCard({
  className,
  id: defaultId,
}: {
  className?: string;
  id: string;
}) {
  const stories = useCosmos((state) => state.stories);
  const [currentId, setCurrentId] = useState(defaultId);

  const story = useMemo(
    () => (stories?.[currentId] ? stories[currentId] : null),
    [stories, currentId]
  );

  // 当 defaultId 改变时，更新 currentId
  useEffect(() => {
    setCurrentId(defaultId);
  }, [defaultId]);

  // 改进过滤逻辑
  const [availablePrevStories, availableNextStories] = useMemo(() => {
    if (!story || !stories) return [[], []];

    console.log(story);

    // 确保 last_ids 和 next_ids 是数组
    const lastIds = Array.isArray(story.last_ids) ? story.last_ids : [];
    const nextIds = Array.isArray(story.next_ids) ? story.next_ids : [];

    // 如果不是数组，修复数据
    if (!Array.isArray(story.last_ids) || !Array.isArray(story.next_ids)) {
      useCosmos.getState().updateStory(story.id, {
        last_ids: lastIds,
        next_ids: nextIds,
      });
    }

    // 获取所有有效的故事ID
    const validStoryIds = new Set(Object.keys(stories));

    // 清理无效的关联ID
    const cleanInvalidLinks = () => {
      const validLastIds = lastIds.filter((id) => validStoryIds.has(id));
      const validNextIds = nextIds.filter((id) => validStoryIds.has(id));

      if (
        validLastIds.length !== lastIds.length ||
        validNextIds.length !== nextIds.length
      ) {
        useCosmos.getState().updateStory(story.id, {
          last_ids: validLastIds,
          next_ids: validNextIds,
        });
      }
    };

    cleanInvalidLinks();

    // 过滤可用的前置故事
    const availablePrev = Object.values(stories).filter(
      (s) =>
        s?.id &&
        s.id !== currentId &&
        !lastIds.includes(s.id) &&
        !nextIds.includes(s.id)
    );

    // 过滤可用的后续故事
    const availableNext = Object.values(stories).filter(
      (s) =>
        s?.id &&
        s.id !== currentId &&
        !lastIds.includes(s.id) &&
        !nextIds.includes(s.id)
    );

    return [availablePrev, availableNext];
  }, [stories, story, currentId]);

  if (!story || !stories) return null;

  return (
    <div
      onContextMenu={(e) => {
        e.stopPropagation();
      }}
      className={cn("h-full flex flex-col", className)}
    >
      <div className="sticky top-0 z-10 bg-background/80 px-4 py-4 flex items-center justify-between gap-1">
        <TbScript
          className={cn(
            "w-10 h-10 text-accent-foreground hover:bg-accent p-1 rounded-lg transition-transform shrink-0"
          )}
        />
        <StoryTitle story={story} />
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            dialog.confirm({
              title: "确认删除",
              content: `确认要删除情节${story.name}吗？\n删除情节后，该情节、该情节下的所有嵌套子情节、与该情节和该情节下所有嵌套子情节关联的角色状态和角色关系均会被删除。请谨慎考虑后执行。`,
              okText: "确认",
              cancelText: "取消",
              onOk: () => useCosmos.getState().removeStory(story.id),
            });
          }}
          className="h-8 w-8 flex-none"
        >
          <TbTrash className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-[850px] w-full flex-1 overflow-auto mx-auto px-4 pb-4 space-y-2">
        <TimelineSpace
          story={story}
          stories={stories}
          availablePrevStories={availablePrevStories}
          availableNextStories={availableNextStories}
          onStoryChange={setCurrentId}
        />
        <StoryBodyEditor story_id={story.id} />
      </div>
    </div>
  );
});
