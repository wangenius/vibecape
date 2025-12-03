import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { updateSettings, useSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";
import { setLang } from "@/locales/i18n";
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem, SettingCard } from "./SettingComponents";

const THEME_OPTIONS = [
  "default",
  "dim",
  "forest",
  "graph",
  "haze",
  "mono",
  "ocean",
  "sunset",
  "vercel",
];

const LANGUAGE_OPTIONS = [
  { value: "zh-CN", label: "中文" },
  { value: "en-US", label: "English" },
];

export const GeneralSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();

  const handleThemeChange = useCallback((value: string) => {
    void updateSettings(settingsShape.ui.theme, value);
  }, []);

  const handleModeChange = useCallback((checked: boolean) => {
    void updateSettings(settingsShape.ui.mode, checked ? "dark" : "light");
  }, []);

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.settings.appearance")}
        description={t("common.settings.customizeInterface")}
      >
        <div className="space-y-2">
          <SettingItem
            label={
              settings.ui.mode === "dark"
                ? t("common.settings.darkMode")
                : t("common.settings.lightMode")
            }
            description={t("common.settings.toggleMode")}
          >
            <Switch
              checked={settings.ui.mode === "dark"}
              onCheckedChange={handleModeChange}
            />
          </SettingItem>

          <SettingItem
            label={t("common.settings.theme")}
            description={t("common.settings.selectTheme")}
          >
            <Select value={settings.ui.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {THEME_OPTIONS.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {t(`common.themes.${theme}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingItem>
        </div>
      </SettingSection>

      <SettingSection
        title={t("common.settings.language")}
        description={t("common.settings.languageSettings")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.settings.systemLanguage")}
            description={t("common.settings.systemLanguageDesc")}
          >
            <Select
              value={settings.ui.language}
              onValueChange={(value) => setLang(value as "zh-CN" | "en-US")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingItem>

          <SettingItem
            label={t("common.settings.aiPromptLanguage")}
            description={t("common.settings.aiPromptLanguageDesc")}
          >
            <Select
              value={settings.ui.promptLanguage}
              onValueChange={(value) =>
                updateSettings(settingsShape.ui.promptLanguage, value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingItem>
        </div>
      </SettingSection>

      <SettingSection
        title={t("common.settings.networkProxy")}
        description={t("common.settings.proxySettings")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.settings.enableProxy")}
            description={t("common.settings.enableProxyDesc")}
          >
            <Switch
              checked={settings.general.proxy.enabled}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.general.proxy.enabled, checked)
              }
            />
          </SettingItem>

          {settings.general.proxy.enabled && (
            <SettingCard>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.proxyAddress")}
                </label>
                <Input
                  placeholder={t("common.settings.proxyPlaceholder")}
                  value={settings.general.proxy.url}
                  onChange={(event) =>
                    updateSettings(
                      settingsShape.general.proxy.url,
                      event.target.value
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("common.settings.proxySupport")}
                </p>
              </div>
            </SettingCard>
          )}
        </div>
      </SettingSection>
    </div>
  );
};
