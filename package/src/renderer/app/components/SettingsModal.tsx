import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateSettings, useSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";
import {
  useModels,
  useDefaultModels,
  updateDefaultModel,
  createModel,
  updateModel,
  deleteModel,
  refreshModels,
  type ModelCategoryKey,
} from "@/hook/model/useModel";
import { BsStars } from "react-icons/bs";
import { MoreVertical } from "lucide-react";

const THEME_OPTIONS = [
  { value: "default", label: "默认" },
  { value: "dim", label: "微光" },
  { value: "forest", label: "森林" },
  { value: "ocean", label: "海洋" },
  { value: "sunset", label: "日落" },
];

// 通用设置
export const GeneralSettings = () => {
  const settings = useSettings();

  const handleThemeChange = useCallback((value: string) => {
    void updateSettings(settingsShape.ui.theme, value);
  }, []);

  const handleModeChange = useCallback((checked: boolean) => {
    void updateSettings(settingsShape.ui.mode, checked ? "dark" : "light");
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">外观</h3>
          <p className="text-sm text-muted-foreground mt-1">
            自定义界面外观和主题
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {settings.ui.mode === "dark" ? "黑暗模式" : "明亮模式"}
              </span>
              <p className="text-xs text-muted-foreground">
                切换明亮和黑暗显示模式
              </p>
            </div>
            <Switch
              checked={settings.ui.mode === "dark"}
              onCheckedChange={handleModeChange}
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">主题</span>
              <p className="text-xs text-muted-foreground">选择界面主题风格</p>
            </div>
            <Select value={settings.ui.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">网络代理</h3>
          <p className="text-sm text-muted-foreground mt-1">
            配置应用访问外部服务时的代理设置
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">启用代理</span>
              <p className="text-xs text-muted-foreground">
                通过代理访问外部网络服务
              </p>
            </div>
            <Switch
              checked={settings.general.proxy.enabled}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.general.proxy.enabled, checked)
              }
            />
          </div>

          {settings.general.proxy.enabled && (
            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
              <label className="text-sm font-medium">代理地址</label>
              <Input
                placeholder="例如：http://127.0.0.1:7890"
                value={settings.general.proxy.url}
                onChange={(event) =>
                  updateSettings(
                    settingsShape.general.proxy.url,
                    event.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                支持 HTTP、HTTPS 代理地址
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// 模型表单类型
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

const createEmptyForm = (): ModelForm => ({
  name: "",
  model: "",
  base_url: "",
  api_key: "",
  type: "text",
  json: false,
  reasoner: false,
});

// 模型设置
export const ModelSettings = () => {
  const models = useModels();
  const defaultModels = useDefaultModels();
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const modelList = useMemo(() => Object.values(models), [models]);

  const categories: Array<{
    key: ModelCategoryKey;
    label: string;
    description: string;
  }> = [
    { key: "primary", label: "主模型", description: "用于核心功能的主要模型" },
    { key: "fast", label: "快速模型", description: "用于快速响应的轻量级模型" },
  ];

  useEffect(() => {
    setRefreshing(true);
    void refreshModels().finally(() => setRefreshing(false));
  }, []);

  const startCreate = () => {
    setForm(createEmptyForm());
    setEditingId("__new");
    setSheetOpen(true);
  };

  const startEdit = (model: (typeof modelList)[0]) => {
    setForm({
      name: model.name,
      model: model.model,
      base_url: model.base_url,
      api_key: model.api_key,
      type: (model.type as ModelForm["type"]) || "text",
      json: model.json,
      reasoner: model.reasoner,
    });
    setEditingId(model.id);
    setSheetOpen(true);
  };

  const cancelEdit = () => {
    setForm(null);
    setEditingId(null);
    setSheetOpen(false);
  };

  const handleChange = <K extends keyof ModelForm>(
    key: K,
    value: ModelForm[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    const trimmed = {
      ...form,
      name: form.name.trim(),
      model: form.model.trim(),
      base_url: form.base_url.trim(),
      api_key: form.api_key.trim(),
    };

    if (
      !trimmed.name ||
      !trimmed.model ||
      !trimmed.base_url ||
      !trimmed.api_key
    ) {
      toast.error("请填写完整的模型信息");
      return;
    }

    try {
      setSaving(true);
      if (editingId === "__new") {
        await createModel(trimmed);
        toast.success("添加模型成功");
      } else if (editingId) {
        await updateModel(editingId, trimmed);
        toast.success("更新模型成功");
      }
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.message ?? "保存模型失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除模型"${name}"吗？`)) return;
    try {
      setDeletingId(id);
      await deleteModel(id);
      toast.success("模型删除成功");
    } catch (error: any) {
      toast.error(error?.message ?? "删除模型失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 模型管理 */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <header>
            <h3 className="text-base font-semibold">模型管理</h3>
            <p className="text-sm text-muted-foreground mt-1">
              管理模型的基本信息与能力标签
            </p>
          </header>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                void refreshModels().finally(() => setRefreshing(false));
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

        {modelList.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
            还没有配置模型，点击"添加模型"开始吧
          </div>
        ) : (
          <div className="space-y-1">
            {modelList.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BsStars className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.json && (
                        <span className="text-[9px] bg-lime-100 text-lime-600 px-1.5 py-0.5 rounded">
                          JSON
                        </span>
                      )}
                      {model.reasoner && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          推理
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {model.model}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={deletingId === model.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(model)}>
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(model.id, model.name)}
                    >
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 默认模型配置 */}
      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">默认模型配置</h3>
          <p className="text-sm text-muted-foreground mt-1">
            为不同功能类别指定默认模型
          </p>
        </header>

        <div className="space-y-2">
          {categories.map((category) => {
            const currentModelId = defaultModels[category.key]?.model_id || "";
            const currentModel = currentModelId ? models[currentModelId] : null;

            return (
              <div
                key={category.key}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{category.label}</span>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Select
                  value={currentModelId || "__none__"}
                  onValueChange={(value) =>
                    void updateDefaultModel(
                      category.key,
                      value === "__none__" ? "" : value
                    )
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue>
                      {currentModel ? currentModel.name : "未选择"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__none__">不使用</SelectItem>
                    {modelList.map((model) => (
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
      </section>

      {/* 编辑模型 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && cancelEdit()}>
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingId === "__new" ? "添加模型" : "编辑模型"}
            </SheetTitle>
            <SheetDescription>填写模型的基本信息和配置</SheetDescription>
          </SheetHeader>

          {form && (
            <div className="flex-1 space-y-4 py-4">
              <div className="space-y-2">
                <Label>展示名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="显示给用户的名称"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>模型名称</Label>
                <Input
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="例如 gpt-4o-mini"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    handleChange("type", v as ModelForm["type"])
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Base URL</Label>
                <Input
                  value={form.base_url}
                  onChange={(e) => handleChange("base_url", e.target.value)}
                  placeholder="模型请求的基础地址"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={form.api_key}
                  onChange={(e) => handleChange("api_key", e.target.value)}
                  placeholder="访问模型所需的密钥"
                  disabled={saving}
                  type="password"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                <div>
                  <p className="text-sm font-medium">支持 JSON 输出</p>
                  <p className="text-xs text-muted-foreground">
                    启用后可用于结构化输出
                  </p>
                </div>
                <Switch
                  checked={form.json}
                  onCheckedChange={(v) => handleChange("json", v)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                <div>
                  <p className="text-sm font-medium">推理模型</p>
                  <p className="text-xs text-muted-foreground">
                    标记为推理类型模型
                  </p>
                </div>
                <Switch
                  checked={form.reasoner}
                  onCheckedChange={(v) => handleChange("reasoner", v)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// 关于页面
export const AboutSettings = () => {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">关于 Local MDX Studio</h3>
          <p className="text-sm text-muted-foreground mt-1">
            本地 MDX 文档编辑工具
          </p>
        </header>

        <div className="rounded-lg bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">版本</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">技术栈</span>
            <span className="text-sm font-medium">
              Electron + React + Tiptap
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
