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
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem, SettingCard } from "./SettingComponents";

export const StorageSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.settings.cloudStorage")}
        description={t("common.settings.cloudStorageDesc")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.settings.enableCloudStorage")}
            description={t("common.settings.enableCloudStorageDesc")}
          >
            <Switch
              checked={settings.general.oss?.enabled ?? false}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.general.oss.enabled, checked)
              }
            />
          </SettingItem>

          {settings.general.oss?.enabled && (
            <SettingCard>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.provider")}
                </label>
                <Select
                  value={settings.general.oss?.provider ?? "aliyun"}
                  onValueChange={(value) =>
                    updateSettings(
                      settingsShape.general.oss.provider,
                      value as "aliyun" | "qiniu" | "tencent" | "s3"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aliyun">
                      {t("common.providers.aliyun")}
                    </SelectItem>
                    <SelectItem value="qiniu">
                      {t("common.providers.qiniu")}
                    </SelectItem>
                    <SelectItem value="tencent">
                      {t("common.providers.tencent")}
                    </SelectItem>
                    <SelectItem value="s3">
                      {t("common.providers.s3")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("common.settings.region")}
                  </label>
                  <Input
                    placeholder={t("common.settings.regionPlaceholder")}
                    value={settings.general.oss?.region ?? ""}
                    onChange={(e) =>
                      updateSettings(
                        settingsShape.general.oss.region,
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("common.settings.bucket")}
                  </label>
                  <Input
                    placeholder={t("common.settings.bucketPlaceholder")}
                    value={settings.general.oss?.bucket ?? ""}
                    onChange={(e) =>
                      updateSettings(
                        settingsShape.general.oss.bucket,
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.accessKeyId")}
                </label>
                <Input
                  placeholder={t("common.settings.accessKeyIdPlaceholder")}
                  value={settings.general.oss?.accessKeyId ?? ""}
                  onChange={(e) =>
                    updateSettings(
                      settingsShape.general.oss.accessKeyId,
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.accessKeySecret")}
                </label>
                <Input
                  type="password"
                  placeholder={t("common.settings.accessKeySecretPlaceholder")}
                  value={settings.general.oss?.accessKeySecret ?? ""}
                  onChange={(e) =>
                    updateSettings(
                      settingsShape.general.oss.accessKeySecret,
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.endpoint")}
                </label>
                <Input
                  placeholder={t("common.settings.endpointPlaceholder")}
                  value={settings.general.oss?.endpoint ?? ""}
                  onChange={(e) =>
                    updateSettings(
                      settingsShape.general.oss.endpoint,
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("common.settings.customDomain")}
                </label>
                <Input
                  placeholder={t("common.settings.customDomainPlaceholder")}
                  value={settings.general.oss?.customDomain ?? ""}
                  onChange={(e) =>
                    updateSettings(
                      settingsShape.general.oss.customDomain,
                      e.target.value
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("common.settings.customDomainDesc")}
                </p>
              </div>
            </SettingCard>
          )}
        </div>
      </SettingSection>
    </div>
  );
};
