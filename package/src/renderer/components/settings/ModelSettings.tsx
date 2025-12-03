import { useEffect, useMemo, useState } from "react";
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
  refreshProviders,
} from "@/hook/model/useProvider";
import { BsStars } from "react-icons/bs";
import { MoreVertical, Plus, Server } from "lucide-react";
import { RemoteModelsSheet } from "../RemoteModelsSheet";
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem, SettingRow } from "./SettingComponents";

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
  type: "text" | "img" | "video";
  json: boolean;
  reasoner: boolean;
};

const MODEL_TYPES: ModelForm["type"][] = ["text", "img", "video"];

const createEmptyForm = (): ModelForm => ({
  name: "",
  model: "",
  provider_id: "",
  type: "text",
  json: false,
  reasoner: false,
});

export const ModelSettings = () => {
  const { t } = useTranslation();
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
  const [editingProviderId, setEditingProviderId] = useState<string | null>(
    null
  );
  const [providerSheetOpen, setProviderSheetOpen] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  const modelList = useMemo(() => Object.values(models), [models]);

  const categories: Array<{
    key: ModelCategoryKey;
    label: string;
    description: string;
  }> = [
    {
      key: "primary",
      label: t("common.settings.primaryModel"),
      description: t("common.settings.primaryModelDesc"),
    },
    {
      key: "fast",
      label: t("common.settings.fastModel"),
      description: t("common.settings.fastModelDesc"),
    },
  ];

  useEffect(() => {
    setRefreshing(true);
    Promise.all([refreshModels(), refreshProviders()]).finally(() =>
      setRefreshing(false)
    );
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
      toast.error(t("common.settings.providerInfo"));
      return;
    }

    try {
      setSavingProvider(true);
      if (editingProviderId === "__new") {
        await createProvider(trimmed);
        toast.success(t("common.settings.addProviderSuccess"));
      } else if (editingProviderId) {
        await updateProvider(editingProviderId, trimmed);
        toast.success(t("common.settings.updateProviderSuccess"));
      }
      cancelEditProvider();
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.saveProviderFailed"));
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(t("common.settings.deleteProvider", { name }))) return;
    try {
      await deleteProvider(id);
      toast.success(t("common.settings.deleteProviderSuccess"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.deleteProviderFailed"));
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
      provider_id: model.provider_id,
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
    };

    if (!trimmed.name || !trimmed.model || !trimmed.provider_id) {
      toast.error(t("common.settings.modelInfo"));
      return;
    }

    try {
      setSaving(true);
      if (editingId === "__new") {
        await createModel(trimmed);
        toast.success(t("common.settings.addModelSuccess"));
      } else if (editingId) {
        await updateModel(editingId, trimmed);
        toast.success(t("common.settings.updateModelSuccess"));
      }
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.saveModelFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("common.settings.deleteModel", { name }))) return;
    try {
      setDeletingId(id);
      await deleteModel(id);
      toast.success(t("common.settings.deleteModelSuccess"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.deleteModelFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider 管理 */}
      <SettingSection
        title={t("common.settings.apiProvider")}
        description={t("common.settings.apiProviderDesc")}
        action={
          <Button size="sm" onClick={startCreateProvider}>
            <Plus className="h-4 w-4 mr-1" />
            {t("common.settings.addProvider")}
          </Button>
        }
      >
        {providers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
            {t("common.settings.noProviders")}
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
                  <RemoteModelsSheet provider={provider} />
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
                      <DropdownMenuItem
                        onClick={() => startEditProvider(provider)}
                      >
                        {t("common.settings.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          handleDeleteProvider(provider.id, provider.name)
                        }
                      >
                        {t("common.settings.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingSection>

      {/* 模型管理 */}
      <SettingSection
        title={t("common.settings.modelManagement")}
        description={t("common.settings.modelManagementDesc")}
        action={
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
              {refreshing
                ? t("common.settings.refreshing")
                : t("common.settings.refresh")}
            </Button>
            <Button size="sm" onClick={startCreate}>
              {t("common.settings.addModel")}
            </Button>
          </div>
        }
      >
        {modelList.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
            {t("common.settings.noModels")}
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
                          {t("common.settings.jsonMode")}
                        </span>
                      )}
                      {model.reasoner && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          {t("common.settings.reasoner")}
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
                      {t("common.settings.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(model.id, model.name)}
                    >
                      {t("common.settings.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </SettingSection>

      {/* 默认模型配置 */}
      <SettingSection
        title={t("common.settings.defaultModelConfig")}
        description={t("common.settings.defaultModelConfigDesc")}
      >
        <div className="space-y-2">
          {categories.map((category) => {
            const currentModelId = defaultModels[category.key]?.model_id || "";
            const currentModel = currentModelId ? models[currentModelId] : null;

            return (
              <SettingItem
                key={category.key}
                label={category.label}
                description={category.description}
              >
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
                      {currentModel
                        ? currentModel.name
                        : t("common.settings.selectModel")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__none__">
                      {t("common.settings.selectModel")}
                    </SelectItem>
                    {modelList.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingItem>
            );
          })}
        </div>
      </SettingSection>

      {/* 编辑模型 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && cancelEdit()}>
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingId === "__new"
                ? t("common.settings.addModel")
                : t("common.settings.editModel")}
            </SheetTitle>
            <SheetDescription>
              {t("common.settings.modelSettingsDesc")}
            </SheetDescription>
          </SheetHeader>

          {form && (
            <div className="flex-1 space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("common.settings.displayName")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={t("common.settings.displayNamePlaceholder")}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("common.settings.modelName")}</Label>
                <Input
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder={t("common.settings.modelNamePlaceholder")}
                  disabled={saving}
                />
              </div>

              <SettingRow
                label={t("common.settings.provider")}
                description={t("common.settings.providerConfigDesc")}
              >
                <Select
                  value={form.provider_id || "__none__"}
                  onValueChange={(v) => {
                    handleChange("provider_id", v === "__none__" ? "" : v);
                  }}
                  disabled={saving}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue
                      placeholder={t("common.settings.providerSelect")}
                    />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__none__" disabled>
                      {t("common.settings.providerSelectPlaceholder")}
                    </SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label={t("common.settings.modelType")}
                description={t("common.settings.modelTypeDesc")}
              >
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    handleChange("type", v as ModelForm["type"])
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {MODEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label={t("common.settings.jsonOutput")}
                description={t("common.settings.jsonOutputDesc")}
              >
                <Switch
                  checked={form.json}
                  onCheckedChange={(v) => handleChange("json", v)}
                  disabled={saving}
                />
              </SettingRow>

              <SettingRow
                label={t("common.settings.reasonerModel")}
                description={t("common.settings.reasonerModelDesc")}
              >
                <Switch
                  checked={form.reasoner}
                  onCheckedChange={(v) => handleChange("reasoner", v)}
                  disabled={saving}
                />
              </SettingRow>
            </div>
          )}

          <SheetFooter className="mt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={cancelEdit}
              disabled={saving}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("common.settings.saving") : t("common.settings.save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Provider 编辑 Sheet */}
      <Sheet
        open={providerSheetOpen}
        onOpenChange={(open) => !open && cancelEditProvider()}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingProviderId === "__new"
                ? t("common.settings.addProvider")
                : t("common.settings.editProvider")}
            </SheetTitle>
            <SheetDescription>
              {t("common.settings.providerSettingsDesc")}
            </SheetDescription>
          </SheetHeader>

          {providerForm && (
            <div className="flex-1 space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("common.settings.name")}</Label>
                <Input
                  value={providerForm.name}
                  onChange={(e) => handleProviderChange("name", e.target.value)}
                  placeholder={t("common.settings.providerNamePlaceholder")}
                  disabled={savingProvider}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("common.settings.baseUrl")}</Label>
                <Input
                  value={providerForm.base_url}
                  onChange={(e) =>
                    handleProviderChange("base_url", e.target.value)
                  }
                  placeholder={t("common.settings.baseUrlPlaceholder")}
                  disabled={savingProvider}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("common.settings.apiKey")}</Label>
                <Input
                  value={providerForm.api_key}
                  onChange={(e) =>
                    handleProviderChange("api_key", e.target.value)
                  }
                  placeholder={t("common.settings.apiKeyPlaceholder")}
                  disabled={savingProvider}
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("common.settings.modelsPath")}</Label>
                <Input
                  value={providerForm.models_path}
                  onChange={(e) =>
                    handleProviderChange("models_path", e.target.value)
                  }
                  placeholder="/models"
                  disabled={savingProvider}
                />
                <p className="text-xs text-muted-foreground">
                  {t("common.settings.modelsPathDesc")}
                </p>
              </div>
            </div>
          )}

          <SheetFooter className="mt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={cancelEditProvider}
              disabled={savingProvider}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleSaveProvider}
              disabled={savingProvider}
            >
              {savingProvider
                ? t("common.settings.saving")
                : t("common.settings.save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
