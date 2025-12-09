import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/hooks/stores";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingItem,
} from "@/components/settings/SettingComponents";
import type { WorkspaceConfig } from "@common/schema/workspace";
import { useDebounce } from "./hooks";

interface BasicSettingsProps {
  config: WorkspaceConfig;
}

export const BasicSettings = ({ config }: BasicSettingsProps) => {
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
