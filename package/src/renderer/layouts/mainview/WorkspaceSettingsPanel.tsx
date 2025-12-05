import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/hooks/stores";
import { useViewManager } from "@/hooks/app/useViewManager";
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem, SettingCard } from "@/features/settings";
import { FolderOpen } from "lucide-react";
import type { WorkspaceConfig } from "@common/schema/workspace";

// 简单防抖 hook
function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timerRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

// 更新 llm.txt
const updateLlmTxt = async (content: string) => {
  await window.api.vibecape.setLlmTxt(content);
};

// 基本信息设置
const BasicSettings = ({ config }: { config: WorkspaceConfig }) => {
  const { t } = useTranslation();
  const updateConfig = useWorkspaceStore(
    (state) => state.updateWorkspaceConfig
  );

  const debouncedNameChange = useDebounce((value: string) => {
    void updateConfig({ name: value });
  }, 500);

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.workspace.basicInfo")}
        description={t("common.workspace.basicInfoDesc")}
      >
        <SettingItem
          label={t("common.workspace.workspaceName")}
          description={t("common.workspace.workspaceNameDesc")}
        >
          <Input
            defaultValue={config.name}
            onChange={(e) => debouncedNameChange(e.target.value)}
            placeholder={t("common.workspace.workspaceName")}
            className="w-60"
          />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

// 资源设置
const AssetSettings = ({ config }: { config: WorkspaceConfig }) => {
  const { t } = useTranslation();
  const updateConfig = useWorkspaceStore(
    (state) => state.updateWorkspaceConfig
  );

  const handlePriorityChange = (value: "oss-first" | "local-first") => {
    void updateConfig({
      asset: {
        ...config.asset,
        upload_priority: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.workspace.assetSettings")}
        description={t("common.workspace.assetSettingsDesc")}
      >
        <SettingItem
          label={t("common.workspace.assetUploadPriority")}
          description={t("common.workspace.assetUploadPriorityDesc")}
        >
          <Select
            value={config.asset?.upload_priority || "local-first"}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="local-first">
                {t("common.workspace.localFirst")}
              </SelectItem>
              <SelectItem value="oss-first">
                {t("common.workspace.ossFirst")}
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>
      </SettingSection>
    </div>
  );
};

// 关联设置
const LinkSettings = ({ config }: { config: WorkspaceConfig }) => {
  const { t } = useTranslation();
  const updateConfig = useWorkspaceStore(
    (state) => state.updateWorkspaceConfig
  );

  const handleEnabledChange = (enabled: boolean) => {
    void updateConfig({
      link: {
        ...config.link,
        enabled,
      },
    });
  };

  const handleTargetChange = (target: "fumadocs" | "docusaurus" | "feishu") => {
    void updateConfig({
      link: {
        ...config.link,
        target,
      },
    });
  };

  const handleSelectDocsPath = async () => {
    const result = await window.electron.ipcRenderer.invoke(
      "dialog:openDirectory"
    );
    if (result) {
      void updateConfig({
        link: {
          ...config.link,
          docs_path: result,
        },
      });
    }
  };

  const handleSelectAssetsPath = async () => {
    const result = await window.electron.ipcRenderer.invoke(
      "dialog:openDirectory"
    );
    if (result) {
      void updateConfig({
        link: {
          ...config.link,
          assets_path: result,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.workspace.linkSettings")}
        description={t("common.workspace.linkSettingsDesc")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.workspace.linkEnabled")}
            description={t("common.workspace.linkEnabledDesc")}
          >
            <Switch
              checked={config.link?.enabled ?? false}
              onCheckedChange={handleEnabledChange}
            />
          </SettingItem>

          {config.link?.enabled && (
            <SettingCard>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.workspace.linkTarget")}
                </label>
                <Select
                  value={config.link?.target || "fumadocs"}
                  onValueChange={handleTargetChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fumadocs">Fumadocs</SelectItem>
                    <SelectItem value="docusaurus">Docusaurus</SelectItem>
                    <SelectItem value="feishu">
                      {t("common.workspace.feishu")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.workspace.docsPath")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={config.link?.docs_path || ""}
                    readOnly
                    placeholder={t("common.workspace.docsPathPlaceholder")}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSelectDocsPath}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("common.workspace.docsPathDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.workspace.assetsPath")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={config.link?.assets_path || ""}
                    readOnly
                    placeholder={t("common.workspace.assetsPathPlaceholder")}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSelectAssetsPath}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("common.workspace.assetsPathDesc")}
                </p>
              </div>
            </SettingCard>
          )}
        </div>
      </SettingSection>
    </div>
  );
};

// AI 上下文设置
const LlmTxtSettings = () => {
  const { t } = useTranslation();
  const [llmTxt, setLlmTxt] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.api.vibecape
      .getLlmTxt()
      .then((content) => {
        setLlmTxt(content);
        setLoaded(true);
      })
      .catch(console.error);
  }, []);

  const debouncedChange = useDebounce((value: string) => {
    void updateLlmTxt(value);
  }, 500);

  if (!loaded) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.workspace.aiContext")}
        description={t("common.workspace.llmTxtDesc")}
      >
        <SettingCard>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("common.workspace.llmTxt")}
            </label>
            <textarea
              defaultValue={llmTxt}
              onChange={(e) => debouncedChange(e.target.value)}
              placeholder={t("common.workspace.llmTxtPlaceholder")}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </SettingCard>
      </SettingSection>
    </div>
  );
};

export const WorkspaceSettingsPanel = () => {
  const { t } = useTranslation();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const settingsSection =
    useViewManager((state) => state.previewCosmosId) || "basic";

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t("common.workspace.noWorkspaceOpen")}
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (settingsSection) {
      case "asset":
        return <AssetSettings config={workspace.config} />;
      case "link":
        return <LinkSettings config={workspace.config} />;
      case "llmtxt":
        return <LlmTxtSettings />;
      case "basic":
      default:
        return <BasicSettings config={workspace.config} />;
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">{renderContent()}</div>
    </div>
  );
};
