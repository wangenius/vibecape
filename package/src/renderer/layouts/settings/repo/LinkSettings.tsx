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
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingItem,
  SettingCard,
} from "@/components/settings/SettingComponents";
import { FolderOpen } from "lucide-react";
import type { WorkspaceConfig } from "@common/schema/workspace";

interface LinkSettingsProps {
  config: WorkspaceConfig;
}

export const LinkSettings = ({ config }: LinkSettingsProps) => {
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
