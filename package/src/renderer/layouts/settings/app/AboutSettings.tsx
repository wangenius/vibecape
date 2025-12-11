import { useTranslation } from "react-i18next";
import iconImage from "@/assets/new-macOS-Default-1024x1024@2x.png";
import {
  SettingsContainer,
  SettingSection,
  InfoRow,
} from "@/layouts/settings/item/SettingComponents";

export const AboutSettings = () => {
  const { t } = useTranslation();
  return (
    <SettingsContainer>
      <SettingSection title="Vibecape" description="NextGen AI Native Docs Editor">
        <div className="flex items-center gap-4 py-2">
          <img src={iconImage} alt="Vibecape" className="size-16 rounded-xl" />
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Vibecape</h3>
            <p className="text-sm text-muted-foreground">
              NextGen AI Native Docs Editor
            </p>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title={t("common.settings.appInfo", "应用信息")}
        description={t("common.settings.appInfoDesc", "版本和开发者信息")}
      >
        <div className="px-3">
          <InfoRow label={t("common.settings.version")}>1.0.0</InfoRow>
          <InfoRow label={t("common.settings.creator")}>
            <a
              href="https://wangenius.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              wangenius
            </a>
          </InfoRow>
          <InfoRow label={t("common.settings.homepage")}>
            <a
              href="https://vibecape.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              vibecape.com
            </a>
          </InfoRow>
        </div>
      </SettingSection>
    </SettingsContainer>
  );
};
