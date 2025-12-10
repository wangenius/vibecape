import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepositoryStore } from "@/hooks/stores";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingItem,
} from "@/layouts/settings/item/SettingComponents";
import type { RepositoryConfig } from "@common/schema/repository";

interface AssetSettingsProps {
  config: RepositoryConfig;
}

export const AssetSettings = ({ config }: AssetSettingsProps) => {
  const { t } = useTranslation();
  const updateConfig = useRepositoryStore(
    (state) => state.updateRepositoryConfig
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
        title={t("common.repository.assetSettings")}
        description={t("common.repository.assetSettingsDesc")}
      >
        <SettingItem
          label={t("common.repository.assetUploadPriority")}
          description={t("common.repository.assetUploadPriorityDesc")}
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
                {t("common.repository.localFirst")}
              </SelectItem>
              <SelectItem value="oss-first">
                {t("common.repository.ossFirst")}
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>
      </SettingSection>
    </div>
  );
};
