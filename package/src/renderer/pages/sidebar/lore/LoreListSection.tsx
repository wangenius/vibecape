import { ROLLBACK_NAME } from "@common/lib/const";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { memo, useCallback, useMemo, useState } from "react";
import {
  PiPencilSimple,
  PiPlus,
  PiSwatchesDuotone,
  PiTrash,
} from "react-icons/pi";
import { TbCheck, TbGridScan, TbPlus, TbSwipe, TbTrash } from "react-icons/tb";

import { context } from "@/components/custom/ContextMenu";
import { FormInput, FormContainer } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AICreateLorePanel } from "@/pages/modal/AICreateLorePanel";
import { LoreCard } from "@/components/cosmos/lore/LoreCard";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { Check } from "lucide-react";
import { SidebarHeader } from "../SidebarHeader";
import { Empty } from "@/components/custom/Empty";
import { BsStars } from "react-icons/bs";
import { useViewManager, setLoreFilter } from "@/hook/app/useViewManager";
import { ParseLorePanel } from "@/pages/modal/ParseLorePanel";
import { Lore } from "@common/schema";
const ANIMATION_CONFIG = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

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
        e.preventDefault();
        e.stopPropagation();

        if (e.button === 2) {
          e.preventDefault();
          if (type.id !== "all") {
            setShowEditPopover(true);
          }
          return;
        }
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
                    .updateLoreType(type.id, { name: data.name });
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
                        useCosmos.getState().removeLoreType(type.id);
                        setShowEditPopover(false);
                      }}
                    >
                      <TbTrash />
                    </Button>
                    <Button size={"icon"} type="submit">
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
      ))}{" "}
      <Button variant="ghost" size="icon" onClick={onCreateType}>
        <div className="flex items-center gap-1 min-w-0">
          <PiPlus />
        </div>
      </Button>
    </div>
  )
);

export const LoreListSection = () => {
  const lores = useCosmos((state) => state?.lores);
  const lore_types = useCosmos((state) => state?.lore_types);
  const loreFilter = useViewManager((selector) => selector.loreFilter);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredLores = useMemo(() => {
    return Object.values(lores || {}).filter(
      (item) =>
        (loreFilter === "all" || item.type_id === loreFilter) && !item.parent_id
    );
  }, [lores, loreFilter]);

  const typesList = useMemo(() => {
    return [
      { id: "all", name: "全部" },
      ...Object.values(lore_types || {}).map((item) => ({
        id: item.id,
        name: item.name,
      })),
    ];
  }, [lore_types]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over) {
        const loreId = active.id as string;
        const typeId = over.id as string;
        if (lores?.[loreId] && lores[loreId].type_id !== typeId) {
          useCosmos.getState().updateLore(loreId, { type_id: typeId });
        }
      }

      setDraggedId(null);
    },
    [lores]
  );

  const handleCreateType = useCallback(() => {
    useCosmos.getState().insertLoreType({ name: "新类型" });
  }, []);

  const handleCreateLore = useCallback(() => {
    useCosmos
      .getState()
      .insertLore({ type_id: loreFilter, name: "新设定" });
  }, [loreFilter]);

  const handleTypeSelect = useCallback((typeId: string) => {
    setLoreFilter(typeId);
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-full">
          <SidebarHeader
            left={null}
            AICreate={AICreateLorePanel}
            list={[
              {
                icon: TbPlus,
                label: "创建设定",
                onClick: handleCreateLore,
              },
              {
                icon: TbGridScan,
                label: "解析设定",
                onClick: () => {
                  ParseLorePanel.open();
                },
              },
            ]}
          />

          <div className="flex-1 flex gap-2 min-h-0">
            <div
              className={`flex-none flex flex-col gap-1 transition-all duration-200
 w-[70px]
              `}
            >
              <TypesList
                types={typesList}
                activeTypeId={loreFilter}
                onTypeSelect={handleTypeSelect}
                onCreateType={handleCreateType}
              />
            </div>

            <div
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                context({
                  content: (close) => (
                    <Menu
                      items={[
                        {
                          label: "新建设定",
                          icon: TbPlus,
                          onClick: () => {
                            close();
                            useCosmos
                              .getState()
                              .insertLore({ type_id: loreFilter });
                          },
                        },
                        {
                          label: "AI创建设定",
                          icon: BsStars,
                          onClick: () => {
                            close();
                            AICreateLorePanel.open();
                          },
                        },
                      ]}
                    />
                  ),
                  event: e,
                  position: "cursor",
                });
              }}
              className="flex-1 min-h-0 overflow-y-auto"
            >
              {filteredLores.length > 0 ? (
                <motion.div
                  key="lore-list"
                  {...ANIMATION_CONFIG}
                  className="flex flex-col gap-1 pb-3"
                >
                  {filteredLores.map((item) => (
                    <LoreListItem
                      key={item.id}
                      item={item}
                      isDragging={draggedId === item.id}
                    />
                  ))}
                </motion.div>
              ) : (
                <Empty content="暂无设定" className="pt-20" />
              )}
            </div>
          </div>

          {draggedId && lores && (
            <DragOverlay>
              <DragOverlayContent lore={lores[draggedId]} />
            </DragOverlay>
          )}
        </div>
      </DndContext>
    </div>
  );
};

const DragOverlayContent = memo(({ lore }: { lore: Lore }) => (
  <div className="flex pointer-events-none w-[120px] bg-background/95 border rounded-md px-2.5 py-1.5 shadow-md backdrop-blur-sm min-w-0 items-center gap-2">
    <TbSwipe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    <span className="text-xs font-medium truncate">
      {lore?.name || "未命名"}
    </span>
  </div>
));
DragOverlayContent.displayName = "DragOverlayContent";

const LoreListItem = memo(
  ({ item, isDragging }: { item: Lore; isDragging: boolean }) => {
    const current = useCosmos((state) => state?.lores[item.id]);
    if (!current) return null;
    const [focus, setFocus] = useState(false);

    const { attributes, listeners, setNodeRef } = useDraggable({
      id: item.id,
      data: {
        type: "lore",
        item,
      },
    });

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              context({
                content: (close) => (
                  <Menu
                    afterClick={close}
                    items={[
                      {
                        icon: PiTrash,
                        label: "删除",
                        variant: "destructive",
                        onClick: () => {
                          useCosmos.getState().removeLore(item.id);
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
            }}
            className={`
              hover:bg-muted/80 hover:border-base-300 
              ${focus ? "bg-muted/90" : ""} 
              ${isDragging ? "opacity-30" : ""} 
              rounded-md cursor-pointer h-[40px] p-1.5 
              flex gap-2.5 items-center 
              transition-all duration-200
              border border-transparent
              data-[state=open]:bg-muted
            `}
          >
            <Button
              size={"icon"}
              ref={setNodeRef}
              {...listeners}
              {...attributes}
              variant={"ghost"}
              className="cursor-grab rounded-md active:cursor-grabbing p-0.5 h-7 w-7"
            >
              <TbSwipe className="h-5 w-5" />
            </Button>
            <div className={"flex flex-1 flex-col justify-center"}>
              <span className={"font-medium text-xs"}>
                {item.name || ROLLBACK_NAME.CONFIGURATION}
              </span>
              <span
                hidden={!item.description}
                className={"text-[10px] text-muted-foreground/80 line-clamp-1"}
              >
                {item.description}
              </span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          side={"right"}
          align={"start"}
          className={"max-h-[calc(100vh-40px)]"}
        >
          <LoreCard id={item.id} />
        </PopoverContent>
      </Popover>
    );
  }
);

LoreListItem.displayName = "LoreListItem";

const TypeItem = memo(
  ({ item, onSelect }: { item: any; onSelect: (item: any) => void }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = useCallback(
      (data: { name: string }) => {
        useCosmos.getState().updateLoreType(item.id, { name: data.name });
        setIsEditing(false);
      },
      [item]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const form = e.currentTarget.form;
          if (form) {
            form.requestSubmit();
          }
        }
        if (e.key === "Escape") {
          setIsEditing(false);
        }
      },
      []
    );

    if (item.id === "all") {
      return (
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 text-sm font-normal hover:bg-accent/80"
          onClick={() => onSelect(item)}
        >
          <PiSwatchesDuotone className="mr-2.5 h-4 w-4 shrink-0" />
          <span>全部</span>
        </Button>
      );
    }

    if (isEditing) {
      return (
        <FormContainer
          defaultValues={{ name: item.name }}
          onSubmit={handleSubmit}
        >
          <div className="group flex items-center w-full">
            <div className="flex-1 flex items-center h-9 px-3">
              <PiSwatchesDuotone className="mr-2.5 h-4 w-4 shrink-0" />
              <FormInput
                name="name"
                autoFocus
                variant="ghost"
                className="flex-1"
                inputClassName="px-2 h-7 text-sm font-normal focus-visible:ring-0"
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </FormContainer>
      );
    }

    return (
      <div className="group flex items-center w-full">
        <Button
          variant="ghost"
          className="flex-1 justify-start h-9 px-3 text-sm font-normal hover:bg-accent/80"
          onClick={() => onSelect(item)}
        >
          <PiSwatchesDuotone className="mr-2.5 h-4 w-4 shrink-0" />
          <span className="truncate">{item.name || "未命名"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <PiPencilSimple className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

TypeItem.displayName = "TypeItem";
