import { Input } from "@/components/ui/input";
import { useRepositoryStore } from "@/hooks/stores";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingItem,
  SettingsContainer,
} from "@/layouts/settings/item/SettingComponents";
import type { RepositoryConfig } from "@common/schema/repository";
import { useDebounce } from "@/hooks/util/useDebounce";

interface BasicSettingsProps {
  config: RepositoryConfig;
}

export const BasicSettings = ({ config }: BasicSettingsProps) => {
  const { t } = useTranslation();
  const updateConfig = useRepositoryStore(
    (state) => state.updateRepositoryConfig
  );

  const debouncedNameChange = useDebounce((value: string) => {
    void updateConfig({ name: value });
  }, 500);

  return (
    <SettingsContainer>
      <SettingSection
        title={t("common.repository.basicInfo")}
        description={t("common.repository.basicInfoDesc")}
      >
        <SettingItem
          label={t("common.repository.repositoryName")}
          description={t("common.repository.repositoryNameDesc")}
        >
          <Input
            defaultValue={config.name}
            onChange={(e) => debouncedNameChange(e.target.value)}
            placeholder={t("common.repository.repositoryName")}
            className="w-60"
          />
        </SettingItem>
      </SettingSection>
    </SettingsContainer>
  );
};
