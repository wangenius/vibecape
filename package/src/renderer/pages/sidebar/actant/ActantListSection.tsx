import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { memo, useCallback, useMemo, useState } from "react";

import { ROLLBACK_NAME } from "@common/lib/const";
import { context } from "@/components/custom/ContextMenu";
import { Empty } from "@/components/custom/Empty";
import { FormContainer, FormInput } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ActantCard } from "@/components/cosmos/actant/ActantCard";
import { AICreateActantPanel } from "@/pages/modal/AICreateActantPanel";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { BsStars } from "react-icons/bs";
import {
  TbCheck,
  TbGridScan,
  TbMoodNeutral,
  TbMoodSmile,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { SidebarHeader } from "../SidebarHeader";
import { useViewManager, setActantFilter } from "@/hook/app/useViewManager";
import { ParseActantPanel } from "@/pages/modal/ParseActantPanel";
import { gen } from "@common/lib/generator";
import { Actant } from "@common/schema";
import type { JSONContent } from "@tiptap/core";

// Helper to extract plain text from JSONContent
const getPlainText = (content: JSONContent | string | undefined): string => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (content.text) return content.text;
  if (content.content) {
    return content.content.map((node) => getPlainText(node)).join("");
  }
  return "";
};

// 修改 TypeButton 组件
const TypeButton = memo(
  ({
    type,
    isActive,
    onClick,
  }: {
    type: { id: string; name: string };
    isActive: boolean;
    onClick: () => void;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: type.id,
    });
    const [showEditPopover, setShowEditPopover] = useState(false);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        // 阻止 PopoverTrigger 的默认行为
        e.preventDefault();
        e.stopPropagation();

        // 如果是右键点击,打开编辑面板
        if (e.button === 2) {
          e.preventDefault();
          if (type.id !== "all") {
            setShowEditPopover(true);
          }
          return;
        }
        // 左键点击切换选中状态
        onClick();
      },
      [type.id, onClick]
    );

    return (
      <Popover open={showEditPopover} onOpenChange={setShowEditPopover}>
        <PopoverTrigger asChild>
          <div
            ref={setNodeRef}
            className={`
              group relative px-2 py-1.5 rounded-md
              transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : isOver
                    ? "bg-primary/5 text-primary/80"
                    : "hover:bg-muted text-muted-foreground"
              }
              ${isOver ? "ring-1 ring-primary/20" : ""}
            `}
            onClick={handleClick}
            onContextMenu={handleClick}
          >
            <span className="text-xs font-medium truncate block">
              {type.name || "未命名"}
            </span>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <FormContainer
                defaultValues={{ name: "" }}
                onSubmit={(data) => {
                  useCosmos
                    .getState()
                    .updateActantType(type.id, { name: data.name });
                  setShowEditPopover(false);
                }}
              >
                <div className="space-y-2">
                  <FormInput name="name" placeholder={type.name} autoFocus />
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      size={"icon"}
                      variant="destructive"
                      onClick={() => {
                        useCosmos.getState().removeActantType(type.id);
                        setShowEditPopover(false);
                      }}
                    >
                      <TbTrash />
                    </Button>
                    <Button size={"icon"} variant="primary" type="submit">
                      <TbCheck />
                    </Button>
                  </div>
                </div>
              </FormContainer>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

// 修改 TypesList 组件
const TypesList = memo(
  ({
    types,
    activeTypeId,
    onTypeSelect,
    onCreateType,
  }: {
    types: { id: string; name: string }[];
    activeTypeId: string;
    onTypeSelect: (typeId: string) => void;
    onCreateType: () => void;
  }) => (
    <div
      className={`flex flex-col gap-0.5 overflow-hidden transition-all p-0.5 duration-200
    opacity-100 visible w-full
      `}
    >
      {types.map((type) => (
        <TypeButton
          key={type.id}
          type={type}
          isActive={activeTypeId === type.id}
          onClick={() => onTypeSelect(type.id)}
        />
      ))}
      <Button variant="ghost" size="icon" onClick={onCreateType}>
        <div className="flex items-center gap-1 min-w-0">
          <TbPlus />
        </div>
      </Button>
    </div>
  )
);

export const ActantListSection = () => {
  const actants = useCosmos((state) => state?.actants);
  const actant_types = useCosmos((state) => state?.actant_types);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const actantFilter = useViewManager((selector) => selector.actantFilter);

  // 使用 useMemo 缓存计算结果
  const filteredActants = useMemo(() => {
    return Object.values(actants || {}).filter(
      (item) => actantFilter === "all" || item.type_id === actantFilter
    );
  }, [actants, actantFilter]);

  const typesList = useMemo((): Array<{ id: string; name: string }> => {
    return [
      { id: "all", name: "全部" },
      ...Object.values(actant_types || {}).map((type) => ({
        id: type.id,
        name: type.name,
      })),
    ];
  }, [actant_types]);

  // 使用 useCallback 缓存回调函数
  const handleCreateType = useCallback(() => {
    const id = gen.id();
    useCosmos.getState().insertActantType({ id, name: "新类型" });
  }, []);

  const handleCreateActant = useCallback(() => {
    const id = gen.id();
    useCosmos.getState().insertActant({
      id,
      type_id: actantFilter === "all" ? "" : actantFilter,
      name: "",
    });
  }, [actantFilter]);

  const handleTypeSelect = useCallback((typeId: string) => {
    setActantFilter(typeId);
  }, []);

  // 添加回丢失的拖拽处理函数
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over) {
        const actantId = active.id as string;
        const typeId = over.id as string;

        // 只有拖到不同的型上才更新
        if (actants?.[actantId] && actants[actantId].type_id !== typeId) {
          useCosmos.getState().updateActant(actantId, { type_id: typeId });
        }
      }

      setDraggedId(null);
    },
    [actants]
  );

  return (
    <div className="flex flex-col h-full relative">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-full">
          <SidebarHeader
            left={null}
            AICreate={AICreateActantPanel}
            list={[
              {
                icon: TbPlus,
                label: "创建角色",
                onClick: handleCreateActant,
              },
              {
                icon: TbGridScan,
                label: "解析角色",
                onClick: () => {
                  ParseActantPanel.open();
                },
              },
            ]}
          />

          <div className="flex-1 flex gap-2 min-h-0">
            <div
              className={`flex-none flex flex-col gap-1 transition-all duration-200
                 w-[70px] `}
            >
              <TypesList
                types={typesList}
                activeTypeId={actantFilter}
                onTypeSelect={handleTypeSelect}
                onCreateType={handleCreateType}
              />
            </div>

            <div
              onContextMenu={(e) => {
                e.preventDefault();
                context({
                  content: (close) => {
                    return (
                      <Menu
                        items={[
                          {
                            label: "新建角色",
                            icon: TbPlus,
                            onClick: () => {
                              close();
                              useCosmos.getState().insertActant({
                                type_id: actantFilter,
                              });
                            },
                          },
                          {
                            label: "AI创建角色",
                            icon: BsStars,
                            onClick: () => {
                              close();
                              AICreateActantPanel.open();
                            },
                          },
                        ]}
                      />
                    );
                  },
                  event: e,
                  position: "cursor",
                });
              }}
              className="flex-1 min-h-0 overflow-y-auto"
            >
              {filteredActants.length > 0 ? (
                filteredActants.map((item) => (
                  <ActantListItem
                    key={item.id}
                    item={item}
                    isDragging={draggedId === item.id}
                  />
                ))
              ) : (
                <Empty content="暂无角色" className="pt-20" />
              )}
            </div>
          </div>

          {draggedId && actants && (
            <DragOverlay>
              <DragOverlayContent actant={actants[draggedId]} />
            </DragOverlay>
          )}
        </div>
      </DndContext>
    </div>
  );
};

const DragOverlayContent = memo(({ actant }: { actant: Actant }) => (
  <div className="flex pointer-events-none w-[120px] bg-background/95 border rounded-md px-2.5 py-1.5 shadow-md backdrop-blur-sm min-w-0 items-center gap-2">
    <TbMoodNeutral className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    <span className="text-xs font-medium truncate">
      {actant?.name || "未命名"}
    </span>
  </div>
));

DragOverlayContent.displayName = "DragOverlayContent";

const ActantListItem = memo(
  ({ item, isDragging }: { item: Actant; isDragging: boolean }) => {
    const actant_types = useCosmos((state) => state?.actant_types);
    const [focus, setFocus] = useState(false);

    const { attributes, listeners, setNodeRef } = useDraggable({
      id: item.id,
      data: {
        type: "actant",
        item,
      },
    });

    const handleContextMenu = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        context({
          content: (close) => (
            <Menu
              afterClick={close}
              items={[
                {
                  icon: TbMoodSmile,
                  label: item.main_char ? "取消主角" : "设置主角",
                  onClick: () => {
                    useCosmos.getState().updateActant(item.id, {
                      main_char: !item.main_char,
                    });
                    close();
                  },
                },

                {
                  icon: TbTrash,
                  label: "删除",
                  variant: "destructive",
                  onClick: () => {
                    useCosmos.getState().removeActant(item.id);
                    close();
                  },
                },
              ]}
            />
          ),
          event,
          position: "cursor",
          x: 0,
          y: 0,
          afterClose: () => setFocus(false),
          beforeOpen: () => setFocus(true),
        });
      },
      [item, actant_types]
    );

    return (
      <div
        className={`
          hover:bg-muted/80 hover:border-base-300 
          ${focus ? "bg-muted/90" : ""} 
          ${isDragging ? "opacity-30" : ""} 
          rounded-md h-10 p-1.5 
          flex gap-2.5 items-center 
          transition-all duration-200
          border border-transparent
        `}
        onContextMenu={handleContextMenu}
      >
        <Button
          size={"icon"}
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          variant={"ghost"}
          className="cursor-grab rounded-md active:cursor-grabbing h-7 w-7 p-0.5 shrink-0"
        >
          {item.main_char ? (
            <TbMoodSmile className="h-5 w-5 fill-lime-100 text-lime-600" />
          ) : (
            <TbMoodNeutral className="h-5 w-5" />
          )}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={
                "flex flex-1 flex-col justify-center cursor-pointer min-w-0"
              }
            >
              <span
                className={
                  "font-medium text-xs flex justify-between items-center"
                }
              >
                {item.name || ROLLBACK_NAME.ACTANT}
              </span>
              <span
                hidden={!item.description}
                className={"text-[10px] text-muted-foreground/80 line-clamp-1"}
              >
                {getPlainText(item.description)}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            side={"right"}
            align={"start"}
            className={"max-h-[calc(100vh-40px)] overflow-auto"}
          >
            <ActantCard id={item.id} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

ActantListItem.displayName = "ActantListItem";
