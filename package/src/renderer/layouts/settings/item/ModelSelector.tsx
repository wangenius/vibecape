"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
                size="full"
                actived={model.id === currentModelId}
              >
                <BsStars />
                {model.name}
              </Button>
            );
          })
        )}
        <Button
          size="full"
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
