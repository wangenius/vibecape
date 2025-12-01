import { useCallback } from "react";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TbPlanet } from "react-icons/tb";
import { toast } from "sonner";
import type { TiptapContent } from "@/components/editor/tiptap-types";
import { TbCopy } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { BaseEditor } from "@/components/editor/BaseEditor";
import { MentionExtension } from "@/components/editor/extensions/MentionExtension";
import StarterKit from "@tiptap/starter-kit";

/**
 * 世界观详情页面
 * 显示打开的世界观的基本信息（名称、描述、标签）
 */
export const CosmosDetailView = () => {
  const cosmos = useCosmos((state) => state.current_meta);

  // 更新名称（带防抖）
  const updateName = useCallback(
    (value: string) => {
      if (!cosmos) return;

      const trimmedValue = value.trim();
      if (!trimmedValue) return; // 不保存空名称

      useCosmos.getState().updateCosmosMeta({ name: trimmedValue });
    },
    [cosmos]
  );

  // 更新描述（带防抖）
  const updateDescription = useCallback(
    (value: TiptapContent) => {
      if (!cosmos) return;

      useCosmos.getState().updateCosmosMeta({ description: value });
    },
    [cosmos]
  );

  if (!cosmos) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/30 mb-6">
          <TbPlanet className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground/60 mb-1">
          未打开世界观
        </p>
        <p className="text-xs text-muted-foreground/60">
          请先从侧边栏打开一个世界观
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="space-y-8 overflow-y-auto overflow-x-hidden p-8 flex-1">
        {/* 头部 - 名称和描述 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TbPlanet className="size-6" />
            <Input
              variant="title"
              defaultValue={cosmos.name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="输入世界观名称..."
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(cosmos.id);
                toast.success("世界观ID已复制到剪贴板");
              }}
            >
              <TbCopy className="size-4" />
            </Button>
          </div>

          <BaseEditor
            key={cosmos.id}
            defaultValue={cosmos.description}
            onChange={updateDescription}
            readonly={false}
            extensions={[StarterKit, ...MentionExtension]}
            placeholder="输入世界观描述..."
            className="min-h-[120px] bg-muted p-3 rounded-lg"
          />

          {/* 标签 */}
          {cosmos.tags && cosmos.tags.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">标签</div>
              <div className="flex flex-wrap gap-2">
                {cosmos.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
