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
        <Button>
          <BsStars />
          <span>{modelInfo?.name || "未配置"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
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
                className={cn(
                  "w-full h-7 px-2 justify-start gap-2",
                  model.id === currentModelId &&
                    "bg-muted-foreground/10 hover:bg-muted-foreground/10"
                )}
              >
                <BsStars />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="text-xs truncate flex-1 text-start">
                      {model.name}
                    </span>
                    {Boolean(model.json) && <small>JSON</small>}
                    {Boolean(model.reasoner) && <small>推理</small>}
                  </div>
                </div>
              </Button>
            );
          })
        )}
        <Button
          onClick={() => {
            setOpen(false);
            openSettingsDialog("models");
          }}
        >
          <TbSettings />
          配置模型
        </Button>
      </PopoverContent>
    </Popover>
  );
}
