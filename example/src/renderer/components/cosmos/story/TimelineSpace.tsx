import { ROLLBACK_NAME } from "@common/lib/const";
import { FilterSelector } from "@/components/custom/FilterSelector";
import { SectionPanel } from "@/components/custom/SectionPanel";
import { DynamicTag } from "@/components/custom/Tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memo, useCallback, useMemo, useState } from "react";
import {
  TbGhost3,
  TbPlus,
  TbScript,
  TbTopologyStar,
  TbTrash,
} from "react-icons/tb";
import { Story, Actant, ActantState } from "@common/schema";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ActantCard } from "@/components/cosmos/actant/ActantCard";

// 获取从起点到所有可达节点的路径
const getAllReachableNodes = (
  startId: string,
  stories: Record<string, Story>,
  visited = new Set<string>()
): Set<string> => {
  if (visited.has(startId)) {
    return visited;
  }

  const story = stories[startId];
  if (!story) {
    return visited;
  }

  visited.add(startId);

  // 确保 next_ids 是数组
  const nextIds = Array.isArray(story.next_ids) ? story.next_ids : [];

  // 递归获取所有可达节点
  for (const nextId of nextIds) {
    getAllReachableNodes(nextId, stories, visited);
  }

  return visited;
};

// 检查添加新连接是否会导致循环
const willFormCycle = (
  fromId: string,
  toId: string,
  stories: Record<string, Story>
): boolean => {
  // 如果目标节点可以到达起始节点，添加这条边会形成环
  const reachableFromActant = getAllReachableNodes(toId, stories);
  return reachableFromActant.has(fromId);
};

const StoryTimelineItem = memo(function StoryTimelineItem({
  story,
  type,
  onRemove,
  onSelect,
}: {
  story: Story;
  type: "prev" | "next";
  onRemove: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="group relative">
      {/* 连接线 */}
      <div
        className={cn(
          "absolute top-1/2 w-3 h-px bg-border",
          type === "prev" ? "-right-3" : "-left-3"
        )}
      />

      {/* 节点圆点 */}
      <div
        className={cn(
          "absolute top-1/2 w-1.5 h-1.5 rounded-full bg-border -translate-y-1/2",
          type === "prev" ? "-right-4" : "-left-4"
        )}
      />
      <DynamicTag
        label={story.name || ROLLBACK_NAME.STORY}
        id={story.id}
        icon={TbScript}
        onClick={onSelect}
        iconVariant="ghost"
        items={[
          {
            label: "删除",
            icon: TbTrash,
            variant: "destructive",
            onClick: () => {
              onRemove();
            },
          },
        ]}
      />
    </div>
  );
});

export const TimelineSpace = memo(
  ({
    story,
    stories,
    availablePrevStories,
    availableNextStories,
    onStoryChange,
  }: {
    story: any;
    stories: Record<string, Story>;
    availablePrevStories: Story[];
    availableNextStories: Story[];
    onStoryChange: (id: string) => void;
  }) => {
    const actants = useCosmos((state) => state.actants);
    const actantStates = useCosmos((state) => state.actant_states);
    const actantTypes = useCosmos((state) => state.actant_types);

    const storyActantStates = useMemo(
      () =>
        Object.values(actantStates).filter(
          (ts) => ts.story_id === story.id
        ) as ActantState[],
      [actantStates, story.id]
    );

    const availableActants = useMemo(() => {
      const addedActantIds = new Set(
        storyActantStates.map((ts) => ts.actant_id)
      );
      return Object.values(actants).filter(
        (actant) => !addedActantIds.has(actant.id)
      ) as Actant[];
    }, [actants, storyActantStates]);

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

    // 使用 useCallback 缓存处理函数，并减少依赖项
    const handleAddPrevStory = useCallback(
      (selectedStory: Story) => {
        if (
          lastIds.includes(selectedStory.id) ||
          nextIds.includes(selectedStory.id)
        ) {
          return;
        }

        // 检查添加边 selectedStory -> story 是否会形成环
        if (!willFormCycle(selectedStory.id, story.id, stories)) {
          const selectedNextIds = Array.isArray(selectedStory.next_ids)
            ? selectedStory.next_ids
            : [];

          useCosmos.getState().updateStory(story.id, {
            last_ids: [...lastIds, selectedStory.id],
          });
          useCosmos.getState().updateStory(selectedStory.id, {
            next_ids: [...selectedNextIds, story.id],
          });
        }
      },
      [story.id, lastIds, nextIds, stories]
    );

    const handleAddNextStory = useCallback(
      (selectedStory: Story) => {
        if (
          lastIds.includes(selectedStory.id) ||
          nextIds.includes(selectedStory.id)
        ) {
          return;
        }

        // 检查添加边 story -> selectedStory 是否会形成环
        if (!willFormCycle(story.id, selectedStory.id, stories)) {
          const selectedLastIds = Array.isArray(selectedStory.last_ids)
            ? selectedStory.last_ids
            : [];

          useCosmos.getState().updateStory(story.id, {
            next_ids: [...nextIds, selectedStory.id],
          });
          useCosmos.getState().updateStory(selectedStory.id, {
            last_ids: [...selectedLastIds, story.id],
          });
        }
      },
      [story.id, lastIds, nextIds, stories]
    );

    const handleRemovePrevStory = useCallback(
      (id: string) => {
        const targetNextIds = Array.isArray(stories[id]?.next_ids)
          ? stories[id].next_ids
          : [];

        useCosmos.getState().updateStory(story.id, {
          last_ids: lastIds.filter((sid: string) => sid !== id),
        });
        useCosmos.getState().updateStory(id, {
          next_ids: targetNextIds.filter((sid: string) => sid !== story.id),
        });
      },
      [story.id, lastIds, stories]
    );

    const handleRemoveNextStory = useCallback(
      (id: string) => {
        const targetLastIds = Array.isArray(stories[id]?.last_ids)
          ? stories[id].last_ids
          : [];

        useCosmos.getState().updateStory(story.id, {
          next_ids: nextIds.filter((sid: string) => sid !== id),
        });
        useCosmos.getState().updateStory(id, {
          last_ids: targetLastIds.filter((sid: string) => sid !== story.id),
        });
      },
      [story.id, nextIds, stories]
    );

    // 过滤可用的前置和后续情节
    const [filteredPrevStories, filteredNextStories] = useMemo(() => {
      const prevStories = availablePrevStories.filter((s) => {
        if (
          s.id === story.id ||
          lastIds.includes(s.id) ||
          nextIds.includes(s.id)
        ) {
          return false;
        }
        return !willFormCycle(s.id, story.id, stories);
      });

      const nextStories = availableNextStories.filter((s) => {
        if (
          s.id === story.id ||
          lastIds.includes(s.id) ||
          nextIds.includes(s.id)
        ) {
          return false;
        }
        return !willFormCycle(story.id, s.id, stories);
      });

      return [prevStories, nextStories];
    }, [
      story.id,
      lastIds,
      nextIds,
      stories,
      availablePrevStories,
      availableNextStories,
    ]);

    // 修改添加按钮的渲染逻辑
    const renderAddButton = (type: "prev" | "next") => {
      const items = type === "prev" ? filteredPrevStories : filteredNextStories;
      const handler = type === "prev" ? handleAddPrevStory : handleAddNextStory;

      if (items.length === 0) return null;

      return (
        <FilterSelector
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2.5 text-xs text-muted-foreground/70 hover:text-muted-foreground border-dashed"
            >
              +
            </Button>
          }
          items={items}
          onSelect={handler}
          placeholder="搜索情节..."
        />
      );
    };

    return (
      <SectionPanel
        title="结构"
        icon={TbTopologyStar}
        collapsible={true}
        actions={
          lastIds.length + nextIds.length > 0 && (
            <span className="text-xs text-muted-foreground/70">
              {lastIds.length + nextIds.length} 个关联
            </span>
          )
        }
      >
        <div className="relative py-6 flex items-center">
          {/* 前置情节 */}
          <div className="flex-1 flex flex-col items-end gap-3 pr-6">
            <div className="flex flex-col items-end gap-2.5">
              {lastIds.map((id: string) => (
                <StoryTimelineItem
                  key={id}
                  story={stories[id]}
                  type="prev"
                  onRemove={() => handleRemovePrevStory(id)}
                  onSelect={() => onStoryChange(id)}
                />
              ))}
              {renderAddButton("prev")}
            </div>
          </div>

          {/* 当前情节 */}
          <div className="shrink-0 px-2 py-0.5 text-xs font-medium bg-primary/5 text-primary rounded-lg border border-primary/20 relative z-10 max-w-[180px] line-clamp-2">
            {story.name || "当前"}
          </div>

          {/* 后续情节 */}
          <div className="flex-1 flex flex-col items-start gap-3 pl-6">
            <div className="flex flex-col items-start gap-2.5">
              {nextIds.map((id: string) => (
                <StoryTimelineItem
                  key={id}
                  story={stories[id]}
                  type="next"
                  onRemove={() => handleRemoveNextStory(id)}
                  onSelect={() => onStoryChange(id)}
                />
              ))}
              {renderAddButton("next")}
            </div>
          </div>
        </div>
        {(storyActantStates.length > 0 || availableActants.length > 0) && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              {availableActants.length > 0 && (
                <FilterSelector
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-xs hover:bg-muted-foreground/20 data-[state=open]:bg-muted-foreground/20"
                    >
                      <TbPlus />
                    </Button>
                  }
                  placeholder="搜索角色..."
                  items={availableActants}
                  itemIcon={TbGhost3}
                  types={actantTypes}
                  onSelect={(item) => {
                    useCosmos.getState().insertActantState({
                      story_id: story.id,
                      actant_id: item.id,
                    });
                  }}
                  filter={(item, type) => {
                    return item.type_id === type;
                  }}
                  defaultItemName={ROLLBACK_NAME.ACTANT}
                />
              )}
            </div>

            <div className="relative flex flex-wrap gap-1">
              {storyActantStates.map((state) => (
                <TimelineActantStateTag
                  key={state.id}
                  actant={actants[state.actant_id] as Actant}
                  actantState={state}
                />
              ))}
            </div>
          </div>
        )}
      </SectionPanel>
    );
  }
);

const TimelineActantStateTag = ({
  actant,
  actantState,
}: {
  actant: Actant;
  actantState: ActantState;
}) => {
  const [open, setOpen] = useState(false);

  if (!actant) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DynamicTag
          label={actant.name || ROLLBACK_NAME.ACTANT}
          id={actant.id}
          icon={TbGhost3}
          iconVariant="ghost"
          items={[
            {
              label: "删除",
              icon: TbTrash,
              variant: "destructive",
              onClick: () => {
                useCosmos.getState().removeActantState(actantState.id);
                setOpen(false);
              },
            },
          ]}
        />
      </PopoverTrigger>

      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="right"
        sideOffset={4}
      >
        <ActantCard id={actant.id} default_story={actantState.story_id} />
      </PopoverContent>
    </Popover>
  );
};
