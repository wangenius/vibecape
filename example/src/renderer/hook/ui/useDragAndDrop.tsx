import { useNovelStore } from "@/hook/novel/useNovel";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { TbScript, TbWallpaper } from "react-icons/tb";
import { useCosmos } from "../cosmos/useCosmos";
import { Chapter } from "@common/schema/novel";

export const useDragAndDrop = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTimer, setDragOverTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽开始事件
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log(event.active.data);
    setData(event.active.data.current);
    setIsDragging(true);
    setIsDraggingOver(null);
  }, []);

  // 处理拖拽悬停事件
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id.toString() === over.id.toString()) return;
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }

      const timer = setTimeout(() => {
        if (over.data.current?.type === "story") {
          setIsDraggingOver(over.data.current?.id as string);
        }
      }, 800);

      setDragOverTimer(timer);
    },
    [dragOverTimer]
  );

  // 处理拖拽结束事件
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }

      if (over && active.id.toString() !== over.id.toString()) {
        const dragId = active.id.toString();
        const dropId = over.id.toString();
        const dragType = active.data.current?.type as string;
        const dropType = over.data.current?.type as string;

        if (dragType === "chapter" && dropType === "chapter") {
          const { active, over } = event;
          setIsDragging(false);
          const chapters = useNovelStore.getState().chapters;
          if (!chapters) return;

          if (over && active.data.current?.id !== over.data.current?.id) {
            const dragId = active.data.current?.id as string;
            const dropId = over.data.current?.id as string;
            const oldIndex = chapters.findIndex((item) => item.id === dragId);
            const newIndex = chapters.findIndex((item) => item.id === dropId);

            useNovelStore.getState().setChapters((prevChapters: Chapter[]) => {
              return arrayMove(
                prevChapters,
                oldIndex,
                newIndex < oldIndex ? newIndex + 1 : newIndex
              );
            });
          }
        } else if (dragType !== "chapter" && dropType === "chapter") {
          // 将story拖拽到章节上
          const stories = useCosmos.getState().stories;
          const story = stories[dragId];
          if (!story) return;
          const chapters = useNovelStore.getState().chapters;
          if (!chapters) return;
          chapters.findIndex((item) => item.id === dropId);
          // const outline = story.body?.toText?.() || story.description || "";
          // const { channel } = await window.api.ai.chapterizeStart({ outline });
          // const ipc = window.electron?.ipcRenderer;
          // if (ipc) {
          //   const handler = (_e: unknown, payload: any) => {
          //     if (payload?.type === "end" || payload?.type === "error") {
          //       ipc.removeAllListeners(channel);
          //     }
          //   };
          //   ipc.on(channel, handler);
          // }
        } else if (dragType !== "chapter" && dropType !== "chapter") {
          // 处理故事拖拽
          const stories = useCosmos.getState().stories;
          const dragStory = stories[dragId];
          const dropStory = stories[dropId];

          if (dragStory && dropStory) {
            // 检查是否拖到了自己的子节点中
            const isValidDrop = (() => {
              // 获取所有子节点ID
              const getChildrenIds = (storyId: string): Set<string> => {
                const result = new Set<string>();
                const children = Object.values(stories).filter(
                  (s) => s.parent_id === storyId
                );
                children.forEach((child) => {
                  result.add(child.id);
                  getChildrenIds(child.id).forEach((id) => result.add(id));
                });
                return result;
              };

              // 如果目标是拖动节点的子节点，则不允许拖放
              const childrenIds = getChildrenIds(dragId);
              return !childrenIds.has(dropId);
            })();

            if (!isValidDrop) {
              return;
            }

            if (isDraggingOver === dropId) {
              // 拖到目标节点上，成为其子节点
              const children = Object.values(stories)
                .filter((s) => s.parent_id === dropId)
                .sort((a, b) => a.order_index - b.order_index);

              // 计算新的order_index，确保是当前最大order_index + 1
              const maxOrderIndex =
                children.length > 0
                  ? Math.max(...children.map((c) => c.order_index))
                  : -1;

              useCosmos.getState().updateStory(dragStory.id, {
                parent_id: dropId,
                order_index: maxOrderIndex + 1,
              });
            } else {
              // 拖到目标节点旁边，成为兄弟节点
              const newParentId = dropStory.parent_id;

              // 获取目标节点的所有兄弟节点，按order_index排序
              const siblings = Object.values(stories)
                .filter((s) => s.parent_id === newParentId)
                .sort((a, b) => a.order_index - b.order_index);

              // 获取目标节点在其兄弟中的索引
              const dropIndex = siblings.findIndex((s) => s.id === dropId);

              // 计算新的order_index，默认放在目标节点前面
              const newOrderIndex = (() => {
                if (siblings.length === 0) return 0;
                if (dropIndex === 0) return siblings[0].order_index - 1;
                return (
                  (siblings[dropIndex - 1].order_index +
                    siblings[dropIndex].order_index) /
                  2
                );
              })();

              // 更新拖动节点的父节点和顺序
              useCosmos.getState().updateStory(dragStory.id, {
                parent_id: newParentId,
                order_index: newOrderIndex,
              });

              // 如果order_index值太接近，重新分配所有兄弟节点的order_index
              const minGap = 1; // 最小间隔
              const needsReindex = siblings.some((story, idx) => {
                if (idx === 0) return false;
                return (
                  story.order_index - siblings[idx - 1].order_index < minGap
                );
              });

              if (needsReindex) {
                // 重新分配所有兄弟节点的order_index，确保间隔足够
                siblings.forEach((s, idx) => {
                  if (s.id !== dragId) {
                    useCosmos
                      .getState()
                      .updateStory(s.id, { order_index: idx * 10 });
                  }
                });
                // 更新拖动节点的order_index，放在目标节点前面
                useCosmos
                  .getState()
                  .updateStory(dragStory.id, {
                    order_index: dropIndex * 10 - 5,
                  });
              }
            }
          }
        }
      }

      setActiveId(null);
      setIsDragging(false);
      setIsDraggingOver(null);
    },
    [dragOverTimer, isDraggingOver]
  );

  // 处理拖拽取消事件
  const handleDragCancel = useCallback(() => {
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
    }
    setActiveId(null);
    setIsDragging(false);
    setIsDraggingOver(null);
  }, [dragOverTimer]);

  return {
    activeId,
    data,
    isDragging,
    isDraggingOver,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};

// 创建一个包装器来处理拖拽功能
export const DndWrapper = ({ children }: { children: React.ReactNode }) => {
  const {
    activeId,
    data,
    isDragging,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      onDragOver={handleDragOver}
      collisionDetection={
        activeId && activeId.toString().startsWith("[chapter]")
          ? closestCenter
          : undefined
      }
    >
      {children}
      <AnimatePresence>
        {isDragging && (
          <DragOverlay dropAnimation={null}>
            {activeId && (
              <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background border rounded-lg shadow-lg p-1 text-sm line-clamp-1 flex items-center gap-2 max-w-72 w-fit"
              >
                {data?.type === "chapter" ? (
                  <TbWallpaper className="w-4 h-4 flex-none" />
                ) : (
                  <TbScript className="w-4 h-4 flex-none" />
                )}
                <div className="line-clamp-1">{data?.name}</div>
              </motion.div>
            )}
          </DragOverlay>
        )}
      </AnimatePresence>
    </DndContext>
  );
};
