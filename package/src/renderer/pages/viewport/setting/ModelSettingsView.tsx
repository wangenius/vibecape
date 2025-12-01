import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MoreVertical } from "lucide-react";
import {
  TbSparkles,
  TbBolt,
  TbPhoto,
  TbVideo,
  TbMicrophone,
} from "react-icons/tb";
import type {
  ModelProps,
  ModelCreatePayload,
  ModelUpdatePayload,
} from "@common/types/llm";
import {
  Models,
  useDefaultModels,
  updateDefaultModel,
  type ModelCategoryKey,
} from "@/hook/model/useModel";

type ModelForm = {
  name: string;
  model: string;
  base_url: string;
  api_key: string;
  type: "text" | "img" | "video";
  json: boolean;
  reasoner: boolean;
};

const MODEL_TYPES: ModelForm["type"][] = ["text", "img", "video"];

// 类别配置
const CATEGORY_CONFIG: {
  category: ModelCategoryKey;
  label: string;
  description: string;
  icon: typeof TbSparkles;
}[] = [
  {
    category: "primary",
    label: "主模型",
    description: "支持 JSON 输出和工具调用",
    icon: TbSparkles,
  },
  {
    category: "fast",
    label: "快速模型",
    description: "小参数、快速响应",
    icon: TbBolt,
  },
  {
    category: "image",
    label: "图片模型",
    description: "图片生成和处理",
    icon: TbPhoto,
  },
  {
    category: "video",
    label: "视频模型",
    description: "视频生成和处理",
    icon: TbVideo,
  },
  {
    category: "voice",
    label: "语音模型",
    description: "语音合成和识别",
    icon: TbMicrophone,
  },
];

const createEmptyForm = (): ModelForm => ({
  name: "",
  model: "",
  base_url: "",
  api_key: "",
  type: "text",
  json: false,
  reasoner: false,
});

const ensureModelType = (value?: string): ModelForm["type"] =>
  MODEL_TYPES.includes(value as ModelForm["type"])
    ? (value as ModelForm["type"])
    : "text";

const toForm = (model: ModelProps): ModelForm => ({
  name: model.name ?? "",
  model: model.model ?? "",
  base_url: model.base_url ?? "",
  api_key: model.api_key ?? "",
  type: ensureModelType(model.type),
  json: Boolean(model.json),
  reasoner: Boolean(model.reasoner),
});

export const ModelSettingsView: FC = () => {
  const models = Models.use();
  const defaultModels = useDefaultModels();
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [form, setForm] = useState<ModelForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setRefreshing(true);
    void Models.refresh().finally(() => setRefreshing(false));
  }, []);

  const list = useMemo(() => {
    return Object.values(models).sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const startCreate = () => {
    setForm(createEmptyForm());
    setEditingId("__new");
    setSheetOpen(true);
  };

  const startEdit = (model: ModelProps) => {
    setForm(toForm(model));
    setEditingId(model.id);
    setSheetOpen(true);
  };

  const startDuplicate = (model: ModelProps) => {
    const baseForm = toForm(model);

    const duplicateForm: ModelForm = {
      ...baseForm,
      name: `${baseForm.name} (副本)`,
    };

    setForm(duplicateForm);
    setEditingId("__new");
    setSheetOpen(true);
  };

  const cancelEdit = () => {
    setForm(null);
    setEditingId(null);
    setSheetOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除模型"${name}"吗？`)) {
      return;
    }
    try {
      setDeletingId(id);
      await Models.delete(id);
      toast.success("模型删除成功");
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error: any) {
      toast.error(error?.message ?? "删除模型失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = <K extends keyof ModelForm>(
    key: K,
    value: ModelForm[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const validateForm = (payload: ModelForm) => {
    const requiredKeys: Array<keyof ModelForm> = [
      "name",
      "model",
      "base_url",
      "api_key",
    ];
    for (const key of requiredKeys) {
      if (typeof payload[key] === "string" && !payload[key].trim()) {
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!form) return;
    const trimmed: ModelForm = {
      ...form,
      name: form.name.trim(),
      model: form.model.trim(),
      base_url: form.base_url.trim(),
      api_key: form.api_key.trim(),
    };

    if (!validateForm(trimmed)) {
      toast.error("请填写完整的模型信息");
      return;
    }

    const payload: ModelCreatePayload = {
      name: trimmed.name,
      model: trimmed.model,
      base_url: trimmed.base_url,
      api_key: trimmed.api_key,
      type: trimmed.type,
      json: trimmed.json,
      reasoner: trimmed.reasoner,
    };

    try {
      setSaving(true);
      if (editingId === "__new") {
        await Models.create(payload);
        toast.success("添加模型成功");
      } else if (editingId) {
        const changes: ModelUpdatePayload = payload;
        const result = await Models.update(editingId, changes);
        if (!result) {
          await Models.refresh();
        }
        toast.success("更新模型成功");
      }
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.message ?? "保存模型失败");
    } finally {
      setSaving(false);
    }
  };

  // 处理默认模型选择变化
  const handleDefaultModelChange = async (
    category: ModelCategoryKey,
    modelId: string
  ) => {
    try {
      setSavingCategory(category);
      await updateDefaultModel(category, modelId);
      toast.success("保存成功");
    } catch (error: any) {
      toast.error(error?.message ?? "保存失败");
    } finally {
      setSavingCategory(null);
    }
  };

  // 根据类别获取符合约束的模型
  const getAvailableModels = (category: string) => {
    const defModel = defaultModels[category];
    if (!defModel) return list;

    try {
      const constraints = JSON.parse(defModel.constraints || "{}");

      return list.filter((model) => {
        // 检查类型约束
        if (constraints.type && model.type !== constraints.type) {
          return false;
        }
        // 检查JSON支持约束
        if (constraints.requireJson && !Boolean(model.json)) {
          return false;
        }
        // 检查推理模型约束
        if (constraints.noReasoner && Boolean(model.reasoner)) {
          return false;
        }
        return true;
      });
    } catch {
      return list;
    }
  };

  const renderFormContent = () => {
    if (!form) return null;

    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name">展示名称</Label>
            <Input
              id="model-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={saving}
              placeholder="显示给用户的名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-model">模型名称</Label>
            <Input
              id="model-model"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              disabled={saving}
              placeholder="例如 openai/gpt-4o-mini"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-type">类型</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                handleChange("type", ensureModelType(value))
              }
              disabled={saving}
            >
              <SelectTrigger className="w-full" id="model-type">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-base-url">API Base URL</Label>
            <Input
              id="model-base-url"
              value={form.base_url}
              onChange={(e) => handleChange("base_url", e.target.value)}
              disabled={saving}
              placeholder="模型请求的基础地址"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-api-key">API Key</Label>
            <Input
              id="model-api-key"
              value={form.api_key}
              onChange={(e) => handleChange("api_key", e.target.value)}
              disabled={saving}
              placeholder="访问模型所需的密钥"
            />
          </div>

          <div className="flex items-center justify-between rounded-md p-3 bg-muted/40">
            <div>
              <p className="text-sm font-medium">支持 JSON 输出</p>
              <p className="text-xs text-muted-foreground mt-1">
                勾选后在前端展示 JSON 标签。
              </p>
            </div>
            <Switch
              checked={form.json}
              onCheckedChange={(value) => handleChange("json", value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-md p-3 bg-muted/40">
            <div>
              <p className="text-sm font-medium">支持推理模式</p>
              <p className="text-xs text-muted-foreground mt-1">
                勾选后将标记为推理模型。
              </p>
            </div>
            <Switch
              checked={form.reasoner}
              onCheckedChange={(value) => handleChange("reasoner", value)}
              disabled={saving}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* 模型管理区域 */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-base font-semibold">模型管理</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  管理模型的基本信息与能力标签
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefreshing(true);
                    void Models.refresh().finally(() => setRefreshing(false));
                  }}
                  disabled={refreshing}
                >
                  {refreshing ? "刷新中..." : "刷新"}
                </Button>
                <Button size="sm" onClick={startCreate}>
                  添加模型
                </Button>
              </div>
            </div>

            <div className="rounded-lg">
              {!list.length ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  还没有配置模型，点击右上角"添加模型"开始吧。
                </div>
              ) : (
                <div className="space-y-1">
                  {list.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {model.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {Boolean(model.json) && (
                                <Badge variant="outline" className="text-xs">
                                  JSON
                                </Badge>
                              )}
                              {Boolean(model.reasoner) && (
                                <Badge variant="outline" className="text-xs">
                                  推理
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {model.model}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 hover:bg-muted-foreground/10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={deletingId === model.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(model)}>
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => startDuplicate(model)}
                          >
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(model.id, model.name)}
                            disabled={deletingId === model.id}
                          >
                            {deletingId === model.id ? "删除中..." : "删除"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 默认模型配置区域 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">默认模型配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                为不同功能类别指定默认模型
              </p>
            </div>

            <div className="rounded-lg">
              {list.length === 0 ? (
                <div className="py-8 px-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 text-sm text-amber-800 dark:text-amber-200">
                  还没有配置模型，请先在上方的<strong>模型管理</strong>
                  区域添加模型。
                </div>
              ) : (
                <div className="space-y-1">
                  {CATEGORY_CONFIG.map((config) => {
                    const currentModelId =
                      defaultModels[config.category]?.model_id || "";
                    const selectedModelId = currentModelId || "__none__";
                    const selectedModel = currentModelId
                      ? models[currentModelId]
                      : null;
                    const isSaving = savingCategory === config.category;
                    const availableModels = getAvailableModels(config.category);

                    return (
                      <div
                        key={config.category}
                        className="flex items-center justify-between gap-4 p-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">
                                {config.label}
                              </Label>
                              {isSaving && (
                                <span className="text-xs text-muted-foreground">
                                  保存中...
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>

                        <Select
                          value={selectedModelId}
                          onValueChange={(value) => {
                            const modelId = value === "__none__" ? "" : value;
                            handleDefaultModelChange(config.category, modelId);
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue>
                              {selectedModel ? selectedModel.name : "未选择"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">不使用</SelectItem>
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelEdit();
          }
        }}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingId === "__new"
                ? "添加模型"
                : form
                  ? `编辑模型`
                  : "模型设置"}
            </SheetTitle>
            <SheetDescription>填写模型的基本信息和配置。</SheetDescription>
          </SheetHeader>
          <div className="flex-1">{renderFormContent()}</div>
          <SheetFooter className="mt-6">
            <Button
              className="flex-1 h-10"
              onClick={cancelEdit}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              className="flex-1 h-10"
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
