"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  updateDefaultModel,
  useDefaultModels,
  useModels,
} from "@/hooks/model/useModel";
import * as React from "react";
import { BsStars } from "react-icons/bs";
import { TbSettings } from "react-icons/tb";
import { openSettingsDialog } from "@/layouts/settings";

export function ModelSelector() {
  const [open, setOpen] = React.useState(false);
  const defaultModels = useDefaultModels();
  const models = useModels();

  // 从主模型类别读取当前模型
  const currentModelId = defaultModels["primary"]?.model_id || "";
  const modelInfo = currentModelId ? models[currentModelId] : null;

  // 获取符合主模型约束的模型列表
  const availableModels = React.useMemo(() => {
    const primaryConfig = defaultModels["primary"];
    if (!primaryConfig) return Object.values(models);

    try {
      const constraints = JSON.parse(primaryConfig.constraints || "{}");
      return Object.values(models).filter((model) => {
        if (constraints.requireJson && !model.json) return false;
        if (constraints.noReasoner && model.reasoner) return false;
        if (constraints.type && model.type !== constraints.type) return false;
        return true;
      });
    } catch {
      return Object.values(models);
    }
  }, [models, defaultModels]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label="选择主模型"
          variant="ghost"
          className={cn(
            "relative h-7 px-2 gap-1.5",
            modelInfo?.json
              ? "text-purple-600 hover:text-purple-700 hover:bg-purple-100/80"
              : ""
          )}
        >
          <BsStars
            className={cn("size-3", modelInfo?.json ? "text-purple-600" : "")}
          />
          <span className="text-[10px]">{modelInfo?.name || "未配置"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5 space-y-0.5">
        {availableModels.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            暂无可用模型
          </div>
        ) : (
          availableModels.map((model) => {
            return (
              <Button
                key={model.id}
                onClick={() => {
                  void updateDefaultModel("primary", model.id);
                }}
                variant="ghost"
                className={cn(
                  "w-full h-7 px-2 justify-start gap-2",
                  model.id === currentModelId &&
                    "bg-muted-foreground/10 hover:bg-muted-foreground/10"
                )}
              >
                <BsStars className="h-3 w-3 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">
                      {model.name}
                    </span>
                    {Boolean(model.json) && (
                      <span className="shrink-0 text-[9px] font-medium bg-lime-100 text-lime-600 px-1 py-px rounded">
                        JSON
                      </span>
                    )}
                    {Boolean(model.reasoner) && (
                      <span className="shrink-0 text-[9px] font-medium text-blue-600 bg-blue-50/60 px-1 py-px rounded">
                        推理
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            );
          })
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-6 text-xs"
          onClick={() => {
            setOpen(false);
            openSettingsDialog("models");
          }}
        >
          <TbSettings className="h-3 w-3" />
          配置模型
        </Button>
      </PopoverContent>
    </Popover>
  );
}
