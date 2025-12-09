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
} from "@/components/settings/SettingComponents";
import type { WorkspaceConfig } from "@common/schema/workspace";

interface AssetSettingsProps {
  config: WorkspaceConfig;
}

export const AssetSettings = ({ config }: AssetSettingsProps) => {
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
