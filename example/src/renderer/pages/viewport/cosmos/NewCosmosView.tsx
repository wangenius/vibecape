/**
 * 创建新项目页面
 * 在 Viewport 中显示的创建项目表单
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCosmos } from "@/hook/cosmos/useCosmos";
import { useState } from "react";
import { toast } from "sonner";
import { closeTab } from "@/hook/app/useViewManager";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 创建项目表单状态管理
 * 保持表单数据，即使切换标签也不丢失
 */
interface CosmosNewFormState {
  name: string;
  description: string;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  reset: () => void;
}

const useCosmosNewForm = create<CosmosNewFormState>()(
  persist(
    (set) => ({
      name: "",
      description: "",
      setName: (name) => set({ name }),
      setDescription: (description) => set({ description }),
      reset: () =>
        set({
          name: "",
          description: "",
        }),
    }),
    {
      name: "cosmos-new-form",
    }
  )
);

/**
 * 创建新项目组件
 */
export const NewCosmosView = ({ onClose }: { onClose?: () => void }) => {
  const [loading, setLoading] = useState(false);

  // 使用持久化状态
  const formState = useCosmosNewForm();
  const { name, description } = formState;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeTab("cosmos:new");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("请输入世界观名称");
      return;
    }

    try {
      setLoading(true);
      // 将描述转换为 TipTap 格式
      const descriptionContent = description
        ? {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: description }],
              },
            ],
          }
        : {
            type: "doc",
            content: [{ type: "paragraph", content: [] }],
          };
      await createCosmos({
        name: name,
        description: descriptionContent,
        tags: [],
      });
      formState.reset();
      handleClose();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
        {/* 名称 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            世界观名称 <span className="text-destructive">*</span>
          </label>
          <Input
            autoFocus
            value={name}
            placeholder="魔法学院、末日废土、星际联盟..."
            disabled={loading}
            onChange={(e) => formState.setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">简介</label>
          <Textarea
            value={description}
            onChange={(value) => formState.setDescription(value)}
            placeholder="简单描述一下这个世界的特点..."
            disabled={loading}
            className="min-h-[120px]"
          />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex justify-end items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建"}
        </button>
      </div>
    </div>
  );
};
