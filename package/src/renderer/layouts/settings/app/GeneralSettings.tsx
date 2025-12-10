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
import { Button } from "@/components/ui/button";
import { updateSettings, useSettings } from "@/hooks/app/useSettings";
import { useRepositoryStore } from "@/hooks/stores";
import { createShape } from "@common/lib/shape";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";
import { setLang } from "@/lib/locales/i18n";
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem, SettingCard } from "@/layouts/settings/item/SettingComponents";
import { FolderOpen } from "lucide-react";

const appConfigShape = createShape(DEFAULT_APP_CONFIG);

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
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export const GeneralSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();
  const docsRoot = useRepositoryStore((state) => state.docsRoot);
  const setDocsRoot = useRepositoryStore((state) => state.setDocsRoot);

  const handleThemeChange = useCallback((value: string) => {
    void updateSettings(appConfigShape.ui.theme, value);
  }, []);

  const handleModeChange = useCallback((checked: boolean) => {
    void updateSettings(appConfigShape.ui.mode, checked ? "dark" : "light");
  }, []);

  const handleSelectDocsRoot = async () => {
    const result = await window.electron.ipcRenderer.invoke(
      "dialog:openDirectory"
    );
    if (result) {
      await setDocsRoot(result);
    }
  };

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
              onValueChange={(value) => setLang(value as "zh" | "en")}
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
              value={settings.ui.prompt_language}
              onValueChange={(value) =>
                updateSettings(appConfigShape.ui.prompt_language, value)
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
              checked={settings.proxy.enabled}
              onCheckedChange={(checked) =>
                updateSettings(appConfigShape.proxy.enabled, checked)
              }
            />
          </SettingItem>

          {settings.proxy.enabled && (
            <SettingCard>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.proxyAddress")}
                </label>
                <Input
                  placeholder={t("common.settings.proxyPlaceholder")}
                  value={settings.proxy.url}
                  onChange={(event) =>
                    updateSettings(appConfigShape.proxy.url, event.target.value)
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

      <SettingSection
        title={t("common.settings.repositoryStorage")}
        description={t("common.settings.repositoryStorageDesc")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.settings.docsRoot")}
            description={t("common.settings.docsRootDesc")}
          >
            <div className="flex items-center gap-2">
              <Input value={docsRoot} readOnly className="w-60 text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSelectDocsRoot}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </SettingItem>
        </div>
      </SettingSection>
    </div>
  );
};
