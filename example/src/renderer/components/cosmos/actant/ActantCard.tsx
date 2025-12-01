import { AsyncButton } from "@/components/custom/AsyncButton";
import { AvatarEditor } from "./AvatarEditor";
import { dialog } from "@/components/custom/DialogModal";
import { FilterSelector } from "@/components/custom/FilterSelector";
import { SectionPanel } from "@/components/custom/SectionPanel";
import { BaseEditor } from "@/components/editor/BaseEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { useMemo, useRef, useState } from "react";
import { TbEdit, TbRoute, TbTrash } from "react-icons/tb";
import { ActantState } from "@common/schema";
import { Story } from "@common/schema/cosmos_bodies";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import type { TiptapContent } from "@/components/editor/tiptap-types";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MentionExtension } from "@/components/editor/extensions/MentionExtension";

// 类型定义
interface ActantCardProps {
  default_story?: string;
  id: string;
}

// 时间轴组件
const StoryTimeline = ({
  currentStoryId,
  states,
  stories,
  onSelect,
}: {
  currentStoryId: string;
  states: ActantState[];
  stories: Record<string, Story>;
  onSelect: (id: string) => void;
}) => {
  const validStates = states.filter((mark) => !!mark.story_id);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const walk = startX - e.pageX;
    containerRef.current.scrollLeft = scrollLeft + walk;
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <div className="py-1.5 flex-1 relative overflow-x-hidden bg-muted rounded-lg px-2">
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-auto scrollbar-none select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        style={{ overscrollBehavior: "none" }}
      >
        <div className="flex items-center gap-0.5">
          {validStates.length > 0 ? (
            validStates.map((stateItem, index) => (
              <TimelineNode
                key={stateItem.story_id}
                isLast={index === validStates.length - 1}
                isActive={currentStoryId === stateItem.story_id}
                storyName={
                  stateItem.story_id === "default"
                    ? stateItem.name || "简介"
                    : stories[stateItem.story_id]?.name || "未命名情节"
                }
                onSelect={() => onSelect(stateItem.story_id)}
              />
            ))
          ) : (
            <div className="w-full py-1 text-center text-xs text-muted-foreground">
              暂无情节记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 时间轴节点组件
const TimelineNode = ({
  isLast,
  isActive,
  storyName,
  onSelect,
}: {
  isLast: boolean;
  isActive: boolean;
  storyName: string;
  onSelect: () => void;
}) => (
  <div className="flex items-center shrink-0 cursor-default">
    <div onClick={onSelect} className="group relative">
      <div
        className={cn(
          "text-xs font-medium px-2 py-1.5 rounded-md transition-colors whitespace-nowrap text-center",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {storyName}
      </div>
    </div>
    {!isLast && (
      <div className="shrink-0">
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/50" />
      </div>
    )}
  </div>
);

// 角色头像组件
const ActantAvatar = ({
  url,
  name,
  onEdit,
}: {
  url: string;
  name: string;
  onEdit: () => void;
}) => (
  <div
    className="relative group w-[100px] aspect-square rounded-xl 
             ring-1 ring-border/50 overflow-hidden cursor-pointer shrink-0
             from-muted/30 to-muted/10"
    onClick={onEdit}
  >
    {url && url !== "./icon_square.jpg" ? (
      <img src={url} alt="" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-5xl text-muted-foreground/30 font-medium">
          {name?.[0]?.toUpperCase() || "?"}
        </div>
      </div>
    )}
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all">
      <TbEdit className="w-7 h-7 text-white" />
    </div>
  </div>
);

// 角色信息组件
const ActantInfo = ({
  actant,
  actant_types,
}: {
  actant: any;
  actant_types: Record<string, any>;
}) => (
  <div className="flex-1 space-y-3">
    <Input
      key={actant.id} // 确保切换actant时重置输入框
      variant="ghost"
      defaultValue={actant.name}
      autoFocus={actant.name === ""}
      className="text-xl font-semibold h-10 px-0 w-full focus-visible:ring-0 bg-transparent"
      placeholder="输入角色名称..."
      onValueChange={(name) =>
        useCosmos.getState().updateActant(actant.id, { name })
      }
    />
    <div className="flex items-center gap-2">
      <FilterSelector
        align="start"
        trigger={
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs transition-colors cursor-pointer",
              actant.type_id
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {actant.type_id && actant_types[actant.type_id]?.name
              ? actant_types[actant.type_id].name
              : "选择类型"}
          </div>
        }
        items={Object.values(actant_types)}
        placeholder="搜索类型..."
        onSelect={(item) =>
          useCosmos.getState().updateActant(actant.id, { type_id: item.id })
        }
      />
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs transition-colors cursor-pointer",
          actant.main_char
            ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
        onClick={() =>
          useCosmos
            .getState()
            .updateActant(actant.id, { main_char: !actant.main_char })
        }
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {actant.main_char ? "主要角色" : "次要角色"}
      </div>
    </div>
  </div>
);

// 主组件
export const ActantCard = ({
  default_story = "default",
  id,
}: ActantCardProps) => {
  const actant_types = useCosmos((state) => state?.actant_types);
  const actant_states = useCosmos((state) => state?.actant_states);
  const stories = useCosmos((state) => state?.stories);
  const actants = useCosmos((state) => state?.actants);

  if (!actant_types || !actant_states || !stories || !actants) return null;
  const [story_id, setStory_id] = useState(default_story);

  // 检查 actant 是否存在
  if (!actants?.[id]?.id) return null;
  const actant = actants[id];

  const current_states = useMemo(
    () =>
      Object.values(actant_states || {}).filter(
        (it) => it?.actant_id === id
      ) as ActantState[],
    [actant_states, id]
  );

  const state = useMemo(
    () => current_states.find((item) => item.story_id === story_id),
    [current_states, story_id]
  );

  // 如果没有state，显示加载状态
  if (!state) {
    return (
      <div className="h-full flex items-center justify-center bg-background max-w-[600px]">
        <div className="text-sm text-muted-foreground">正在加载...</div>
      </div>
    );
  }

  const handleAvatarEdit = () => {
    dialog({
      title: "编辑头像",
      className: "w-[400px]",
      content: (close) => (
        <AvatarEditor
          actant={actant}
          currentAvatar={actant.avatar || "./icon_square.jpg"}
          onClose={close}
        />
      ),
    });
  };

  const handleDelete = () => {
    dialog.confirm({
      title: "删除角色",
      content: "确定要删除该角色吗？",
      onOk: () => useCosmos.getState().removeActant(actant.id),
    });
  };

  const handleAIAction = async () => {};

  return (
    <div className="h_full flex flex-col bg-background max-w-[600px]">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 bg-background">
        <div className="max-w-[900px] mx-auto px-4 h-14 gap-1 flex items-center justify-between overflow-x-hidden">
          <StoryTimeline
            currentStoryId={story_id}
            states={current_states}
            stories={stories}
            onSelect={setStory_id}
          />
          <div className="flex items-center gap-2 flex-none">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
            >
              <TbTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto pb-4">
        <div className="mx-auto px-4">
          <div className="mt-1 space-y-4">
            {/* 基本信息卡片 */}
            <div className="bg-muted/5 rounded-lg">
              <div className="flex gap-6">
                <ActantAvatar
                  url={actant.avatar || "./icon_square.jpg"}
                  name={actant.name}
                  onEdit={handleAvatarEdit}
                />
                <ActantInfo actant={actant} actant_types={actant_types || {}} />
              </div>
            </div>

            {/* 动态信息 */}
            <div className="space-y-4">
              {/* 动态经历 */}
              <SectionPanel
                title={state.story_id === "default" ? "简介" : "经历描述"}
                icon={TbRoute}
                actions={
                  state.story_id !== "default" && (
                    <AsyncButton
                      variant="ghost"
                      className="text-xs hover:bg-muted-foreground/10"
                      onClick={handleAIAction}
                    >
                      AI填充
                    </AsyncButton>
                  )
                }
              >
                <BaseEditor
                  key={`${actant.id}-${state.story_id}`}
                  className="min-h-[100px] w-full text-sm"
                  defaultValue={
                    state.story_id === "default"
                      ? actant.description
                      : (state.body as TiptapContent)
                  }
                  extensions={[
                    StarterKit,
                    Placeholder.configure({
                      placeholder:
                        state.story_id === "default"
                          ? "输入角色简介..."
                          : "输入经历描述...",
                    }),
                    ...MentionExtension,
                  ]}
                  onChange={(value) => {
                    if (state.story_id === "default") {
                      useCosmos
                        .getState()
                        .updateActant(actant.id, { description: value });
                    } else {
                      useCosmos.getState().updateActantState(state.id, {
                        actant_id: actant.id,
                        body: value,
                      });
                    }
                  }}
                />
              </SectionPanel>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
