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
import {
  useProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  fetchRemoteModels,
  refreshProviders,
  type RemoteModel,
} from "@/hook/model/useProvider";
import { BsStars } from "react-icons/bs";
import { MoreVertical, Plus, RefreshCw, Server } from "lucide-react";

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

// Provider 表单类型
type ProviderForm = {
  name: string;
  base_url: string;
  api_key: string;
  models_path: string;
};

const createEmptyProviderForm = (): ProviderForm => ({
  name: "",
  base_url: "",
  api_key: "",
  models_path: "/models",
});

// 模型表单类型
type ModelForm = {
  name: string;
  model: string;
  provider_id: string;
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
  provider_id: "",
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
  const providersMap = useProviders();
  const providers = useMemo(() => Object.values(providersMap), [providersMap]);
  
  // Model 状态
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModelForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Provider 状态
  const [providerForm, setProviderForm] = useState<ProviderForm | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerSheetOpen, setProviderSheetOpen] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [fetchingModels, setFetchingModels] = useState<string | null>(null);
  const [remoteModels, setRemoteModels] = useState<RemoteModel[]>([]);
  const [lastFetchedProviderId, setLastFetchedProviderId] = useState<string | null>(null);

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
    Promise.all([refreshModels(), refreshProviders()]).finally(() => setRefreshing(false));
  }, []);
  
  // Provider 操作
  const startCreateProvider = () => {
    setProviderForm(createEmptyProviderForm());
    setEditingProviderId("__new");
    setProviderSheetOpen(true);
  };

  const startEditProvider = (provider: (typeof providers)[0]) => {
    setProviderForm({
      name: provider.name,
      base_url: provider.base_url,
      api_key: provider.api_key,
      models_path: provider.models_path,
    });
    setEditingProviderId(provider.id);
    setProviderSheetOpen(true);
  };

  const cancelEditProvider = () => {
    setProviderForm(null);
    setEditingProviderId(null);
    setProviderSheetOpen(false);
    setRemoteModels([]);
  };

  const handleProviderChange = <K extends keyof ProviderForm>(
    key: K,
    value: ProviderForm[K]
  ) => {
    setProviderForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveProvider = async () => {
    if (!providerForm) return;
    const trimmed = {
      ...providerForm,
      name: providerForm.name.trim(),
      base_url: providerForm.base_url.trim(),
      api_key: providerForm.api_key.trim(),
      models_path: providerForm.models_path.trim() || "/models",
    };

    if (!trimmed.name || !trimmed.base_url || !trimmed.api_key) {
      toast.error("请填写完整的 Provider 信息");
      return;
    }

    try {
      setSavingProvider(true);
      if (editingProviderId === "__new") {
        await createProvider(trimmed);
        toast.success("添加 Provider 成功");
      } else if (editingProviderId) {
        await updateProvider(editingProviderId, trimmed);
        toast.success("更新 Provider 成功");
      }
      cancelEditProvider();
    } catch (error: any) {
      toast.error(error?.message ?? "保存 Provider 失败");
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除 Provider "${name}" 吗？`)) return;
    try {
      await deleteProvider(id);
      toast.success("Provider 删除成功");
    } catch (error: any) {
      toast.error(error?.message ?? "删除 Provider 失败");
    }
  };

  const handleFetchModels = async (providerId: string) => {
    try {
      setFetchingModels(providerId);
      const models = await fetchRemoteModels(providerId);
      setRemoteModels(models);
      setLastFetchedProviderId(providerId);
      toast.success(`获取到 ${models.length} 个模型`);
    } catch (error: any) {
      toast.error(error?.message ?? "获取模型列表失败");
      setRemoteModels([]);
      setLastFetchedProviderId(null);
    } finally {
      setFetchingModels(null);
    }
  };

  const handleAddModelFromProvider = async (provider: (typeof providers)[0], remoteModel: RemoteModel) => {
    try {
      await createModel({
        name: remoteModel.id,
        model: remoteModel.id,
        provider_id: provider.id,
        base_url: provider.base_url,
        api_key: provider.api_key,
        type: "text",
        json: false,
        reasoner: false,
      });
      toast.success(`模型 ${remoteModel.id} 添加成功`);
    } catch (error: any) {
      toast.error(error?.message ?? "添加模型失败");
    }
  };

  const startCreate = () => {
    setForm(createEmptyForm());
    setEditingId("__new");
    setSheetOpen(true);
  };

  const startEdit = (model: (typeof modelList)[0]) => {
    setForm({
      name: model.name,
      model: model.model,
      provider_id: model.provider_id || "",
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
      {/* Provider 管理 */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <header>
            <h3 className="text-base font-semibold">API Provider</h3>
            <p className="text-sm text-muted-foreground mt-1">
              管理 API 提供商，可从 Provider 获取模型列表
            </p>
          </header>
          <Button size="sm" onClick={startCreateProvider}>
            <Plus className="h-4 w-4 mr-1" />
            添加 Provider
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
            还没有配置 Provider，点击"添加 Provider"开始吧
          </div>
        ) : (
          <div className="space-y-1">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{provider.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {provider.base_url}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleFetchModels(provider.id)}
                    disabled={fetchingModels === provider.id}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${fetchingModels === provider.id ? 'animate-spin' : ''}`} />
                    {fetchingModels === provider.id ? "获取中..." : "获取模型"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditProvider(provider)}>
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteProvider(provider.id, provider.name)}
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 远程模型列表 */}
        {remoteModels.length > 0 && lastFetchedProviderId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                可用模型 ({providers.find(p => p.id === lastFetchedProviderId)?.name})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setRemoteModels([]);
                  setLastFetchedProviderId(null);
                }}
              >
                清除
              </Button>
            </div>
            <div className="grid gap-1 max-h-48 overflow-y-auto">
              {remoteModels.map((rm) => {
                const provider = providers.find(p => p.id === lastFetchedProviderId);
                return (
                  <div
                    key={rm.id}
                    className="flex items-center justify-between p-2 text-sm rounded bg-muted/20 hover:bg-muted/40"
                  >
                    <span className="truncate">{rm.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => provider && handleAddModelFromProvider(provider, rm)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      添加
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

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
                <Label>Provider（可选）</Label>
                <Select
                  value={form.provider_id || "__none__"}
                  onValueChange={(v) => {
                    const pid = v === "__none__" ? "" : v;
                    handleChange("provider_id", pid);
                    // 自动填充 base_url 和 api_key
                    const provider = providers.find(p => p.id === pid);
                    if (provider) {
                      handleChange("base_url", provider.base_url);
                      handleChange("api_key", provider.api_key);
                    }
                  }}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择 Provider 或手动填写" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">手动填写</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  选择 Provider 可自动填充 API 配置
                </p>
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

      {/* Provider 编辑 Sheet */}
      <Sheet open={providerSheetOpen} onOpenChange={(open) => !open && cancelEditProvider()}>
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingProviderId === "__new" ? "添加 Provider" : "编辑 Provider"}
            </SheetTitle>
            <SheetDescription>配置 API 提供商信息</SheetDescription>
          </SheetHeader>

          {providerForm && (
            <div className="flex-1 space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={providerForm.name}
                  onChange={(e) => handleProviderChange("name", e.target.value)}
                  placeholder="例如 OpenAI、302.ai"
                  disabled={savingProvider}
                />
              </div>

              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={providerForm.base_url}
                  onChange={(e) => handleProviderChange("base_url", e.target.value)}
                  placeholder="例如 https://api.openai.com/v1"
                  disabled={savingProvider}
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  value={providerForm.api_key}
                  onChange={(e) => handleProviderChange("api_key", e.target.value)}
                  placeholder="访问 API 所需的密钥"
                  disabled={savingProvider}
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label>Models 路径</Label>
                <Input
                  value={providerForm.models_path}
                  onChange={(e) => handleProviderChange("models_path", e.target.value)}
                  placeholder="/models"
                  disabled={savingProvider}
                />
                <p className="text-xs text-muted-foreground">
                  获取模型列表的 API 路径，默认 /models
                </p>
              </div>
            </div>
          )}

          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={cancelEditProvider} disabled={savingProvider}>
              取消
            </Button>
            <Button onClick={handleSaveProvider} disabled={savingProvider}>
              {savingProvider ? "保存中..." : "保存"}
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
