import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { dialogForm } from "@/components/ui/DialogForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
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
} from "@/hooks/model/useModel";
import {
  useProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  refreshProviders,
} from "@/hooks/model/useProvider";
import { BsStars } from "react-icons/bs";
import { MoreVertical, Plus, Server } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SettingsContainer,
  SettingSection,
  SettingItem,
  SettingList,
  ListItem,
  Badge,
} from "@/layouts/settings/item/SettingComponents";

import { dialog } from "@/components/ui/dialog";
import {
  getCachedModelCount,
  RemoteModelsDialogContent,
} from "../item/ProviderModels";

// Provider Schema - 纯数据验证
const providerSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  base_url: z.string().min(1, "Base URL 不能为空"),
  api_key: z.string().min(1, "API Key 不能为空"),
  models_path: z.string().default("/models"),
});
type ProviderForm = z.infer<typeof providerSchema>;

// Model 类型
type ModelForm = {
  name: string;
  model: string;
  provider_id: string;
  type: "text" | "img" | "video";
  json: boolean;
  reasoner: boolean;
};

export const ModelSettings = () => {
  const { t } = useTranslation();
  const models = useModels();
  const defaultModels = useDefaultModels();
  const providersMap = useProviders();
  const providers = useMemo(() => Object.values(providersMap), [providersMap]);

  // Model 状态
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Provider 操作 - 使用 dialogForm
  const openProviderDialog = (
    editingId: string | null,
    initialForm: ProviderForm
  ) => {
    dialogForm({
      title:
        editingId === null
          ? t("common.settings.addProvider")
          : t("common.settings.editProvider"),
      description: t("common.settings.providerSettingsDesc"),
      schema: providerSchema,
      fields: {
        name: { label: "名称", placeholder: "Provider 名称" },
        base_url: { label: "Base URL", placeholder: "https://api.example.com" },
        api_key: { label: "API Key", placeholder: "sk-...", type: "password" },
        models_path: {
          label: "Models Path",
          placeholder: "/models",
          description: "获取模型列表的路径",
        },
      },
      defaultValues: initialForm,
      onSubmit: async (form) => {
        try {
          if (editingId === null) {
            await createProvider(form);
            toast.success(t("common.settings.addProviderSuccess"));
          } else {
            await updateProvider(editingId, form);
            toast.success(t("common.settings.updateProviderSuccess"));
          }
        } catch (error: any) {
          toast.error(
            error?.message ?? t("common.settings.saveProviderFailed")
          );
        }
      },
    });
  };

  const startCreateProvider = () => {
    openProviderDialog(null, {
      name: "",
      base_url: "",
      api_key: "",
      models_path: "/models",
    });
  };

  const startEditProvider = (provider: (typeof providers)[0]) => {
    openProviderDialog(provider.id, {
      name: provider.name,
      base_url: provider.base_url,
      api_key: provider.api_key,
      models_path: provider.models_path,
    });
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

  // Model Schema - 纯数据验证
  const modelSchema = z.object({
    name: z.string().min(1, "显示名称不能为空"),
    model: z.string().min(1, "模型名称不能为空"),
    provider_id: z.string().min(1, "请选择 Provider"),
    type: z.enum(["text", "img", "video"]),
    json: z.boolean(),
    reasoner: z.boolean(),
  });

  // Model 操作 - 使用 dialogForm
  const openModelDialog = (
    editingId: string | null,
    initialForm: ModelForm
  ) => {
    dialogForm({
      title:
        editingId === null
          ? t("common.settings.addModel")
          : t("common.settings.editModel"),
      description: t("common.settings.modelSettingsDesc"),
      schema: modelSchema,
      fields: {
        name: { label: "显示名称", placeholder: "模型显示名称" },
        model: { label: "模型名称", placeholder: "gpt-4o" },
        provider_id: {
          label: "Provider",
          options: providers.map((p) => ({ value: p.id, label: p.name })),
        },
        type: { label: "模型类型" },
        json: { label: "JSON 输出", description: "是否支持 JSON 结构化输出" },
        reasoner: { label: "推理模型", description: "是否为推理模型" },
      },
      defaultValues: initialForm,
      onSubmit: async (form) => {
        try {
          if (editingId === null) {
            await createModel(form);
            toast.success(t("common.settings.addModelSuccess"));
          } else {
            await updateModel(editingId, form);
            toast.success(t("common.settings.updateModelSuccess"));
          }
        } catch (error: any) {
          toast.error(error?.message ?? t("common.settings.saveModelFailed"));
        }
      },
    });
  };

  const startCreate = () => {
    openModelDialog(null, {
      name: "",
      model: "",
      provider_id: "",
      type: "text",
      json: false,
      reasoner: false,
    });
  };

  const startEdit = (model: (typeof modelList)[0]) => {
    openModelDialog(model.id, {
      name: model.name,
      model: model.model,
      provider_id: model.provider_id,
      type: (model.type as ModelForm["type"]) || "text",
      json: model.json,
      reasoner: model.reasoner,
    });
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
    <SettingsContainer>
      {/* Provider 管理 */}
      <SettingSection
        title={t("common.settings.apiProvider")}
        description={t("common.settings.apiProviderDesc")}
        action={
          <Button onClick={startCreateProvider}>
            <Plus />
            {t("common.settings.addProvider")}
          </Button>
        }
      >
        <SettingList empty={t("common.settings.noProviders")}>
          {providers.map((provider) => (
            <ListItem
              key={provider.id}
              icon={<Server className="size-4" />}
              title={provider.name}
              subtitle={provider.base_url}
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => {
                      dialog({
                        title: (
                          <span className="flex items-center gap-2">
                            <Server className="size-4" />
                            {provider.name} 可用模型
                          </span>
                        ),
                        description: `从 ${provider.base_url} 获取的模型列表`,
                        className: "w-[600px] h-[80vh]",
                        content: () => (
                          <RemoteModelsDialogContent provider={provider} />
                        ),
                        onClose: () => {
                          getCachedModelCount(provider.id);
                        },
                      });
                    }}
                  >
                    <Server className="size-3" />
                    获取模型
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <MoreVertical />
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
              }
            />
          ))}
        </SettingList>
      </SettingSection>

      {/* 模型管理 */}
      <SettingSection
        title={t("common.settings.modelManagement")}
        description={t("common.settings.modelManagementDesc")}
        action={
          <div className="flex gap-2">
            <Button
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
            <Button onClick={startCreate}>
              {t("common.settings.addModel")}
            </Button>
          </div>
        }
      >
        <SettingList empty={t("common.settings.noModels")}>
          {modelList.map((model) => (
            <ListItem
              key={model.id}
              icon={<BsStars className="size-4" />}
              title={model.name}
              subtitle={model.model}
              badges={
                <>
                  {model.json && (
                    <Badge variant="success">
                      {t("common.settings.jsonMode")}
                    </Badge>
                  )}
                  {model.reasoner && (
                    <Badge variant="info">
                      {t("common.settings.reasoner")}
                    </Badge>
                  )}
                </>
              }
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={deletingId === model.id}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(model)}>
                      {t("common.settings.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(model.id, model.name)}
                    >
                      {t("common.settings.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </SettingList>
      </SettingSection>

      {/* 默认模型配置 */}
      <SettingSection
        title={t("common.settings.defaultModelConfig")}
        description={t("common.settings.defaultModelConfigDesc")}
      >
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
                <SelectTrigger className="w-48">
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
      </SettingSection>
    </SettingsContainer>
  );
};
