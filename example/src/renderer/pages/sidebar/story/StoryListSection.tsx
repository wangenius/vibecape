import { context } from "@/components/custom/ContextMenu";
import { dialog } from "@/components/custom/DialogModal";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import React, { useState, useMemo } from "react";
import {
  TbGridScan,
  TbPlus,
  TbSquareRoundedCheck,
  TbTrash,
  TbX,
} from "react-icons/tb";
import { AICreateStoryPanel } from "../../modal/AICreateStoryPanel";
import { SidebarHeader } from "../SidebarHeader";
import { StoryTreeView } from "./StoryTreeView";
import { BsStars } from "react-icons/bs";
import { ParseStoryPanel } from "@/pages/modal/ParseStoryPanel";
import { useCosmos } from "@/hook/cosmos/useCosmos";

// 多选操作栏组件
const MultiSelectBar: React.FC<{
  onCancel: () => void;
  onDelete: () => void;
}> = ({ onCancel, onDelete }) => {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-1">
        <Button className="text-xs" variant="ghost" onClick={onCancel}>
          <TbX />
          取消
        </Button>
        <Button className="text-xs" variant="destructive" onClick={onDelete}>
          <TbTrash />
          删除
        </Button>
      </div>
    </div>
  );
};

export const StoryListSection: React.FC = () => {
  const stories = useCosmos((state) => state?.stories);
  const storyList = useMemo(() => {
    return Object.values(stories || {}).sort((a, b) => a.order_index - b.order_index);
  }, [stories]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>();
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(
    new Set()
  );
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const handleStorySelect = (storyId: string) => {
    if (!isMultiSelect) {
      setSelectedStoryId(storyId);
      return;
    }

    setSelectedStoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleBatchDelete = () => {
    if (selectedStoryIds.size === 0) {
      setIsMultiSelect(false);
      setSelectedStoryIds(new Set());
      return;
    }
    dialog.confirm({
      title: "确认删除",
      content: `确认要删除选中的 ${selectedStoryIds.size} 个情节吗？删除后将无法恢复。`,
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        selectedStoryIds.forEach(async (id) => {
          await useCosmos.getState().removeStory(id);
        });
        setIsMultiSelect(false);
        setSelectedStoryIds(new Set());
      },
    });
  };

  const cancelMultiSelect = () => {
    setIsMultiSelect(false);
    setSelectedStoryIds(new Set());
  };

  if (!stories) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="h-full flex flex-col flex-1"
    >
      <SidebarHeader
        left={
          <div>
            {isMultiSelect && (
              <MultiSelectBar
                onCancel={cancelMultiSelect}
                onDelete={handleBatchDelete}
              />
            )}
          </div>
        }
        AICreate={AICreateStoryPanel}
        list={[
          {
            icon: TbPlus,
            label: "创建情节",
            onClick: () => {
              useCosmos.getState().insertStory();
            },
          },
          {
            icon: TbGridScan,
            label: "解析情节",
            onClick: () => {
              ParseStoryPanel.open();
            },
          },
        ]}
      />

      <div
        className="flex-1 pt-2 overflow-y-auto"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          context({
            content: (close) => {
              return (
                <Menu
                  items={[
                    {
                      label: "新建情节",
                      icon: TbPlus,
                      onClick: () => {
                        close();
                        useCosmos.getState().insertStory();
                      },
                    },
                    {
                      label: "AI创建情节",
                      icon: BsStars,
                      onClick: () => {
                        close();
                        AICreateStoryPanel.open();
                      },
                    },
                    {
                      label: "选择",
                      icon: TbSquareRoundedCheck,
                      onClick: () => {
                        close();
                        setIsMultiSelect(true);
                      },
                    },
                  ]}
                />
              );
            },
            event: e,
          });
        }}
      >
        <StoryTreeView
          stories={storyList}
          selectedStoryId={selectedStoryId}
          onStorySelect={handleStorySelect}
          selectedStoryIds={selectedStoryIds}
          isMultiSelect={isMultiSelect}
          onMultiSelect={setIsMultiSelect}
        />
      </div>
    </div>
  );
};
