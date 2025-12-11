import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { updateSettings, useSettings } from "@/hooks/app/useSettings";
import { createShape } from "@common/lib/shape";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingItem,
  SettingCard,
  SettingsContainer,
} from "@/layouts/settings/item/SettingComponents";

const appConfigShape = createShape(DEFAULT_APP_CONFIG);

export const StorageSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();

  return (
    <SettingsContainer>
      <SettingSection
        title={t("common.settings.cloudStorage")}
        description={t("common.settings.cloudStorageDesc")}
      >
        <SettingItem
          label={t("common.settings.enableCloudStorage")}
          description={t("common.settings.enableCloudStorageDesc")}
        >
          <Switch
            checked={settings.oss?.enabled ?? false}
            onCheckedChange={(checked) =>
              updateSettings(appConfigShape.oss.enabled, checked)
            }
          />
        </SettingItem>

        {settings.oss?.enabled && (
          <SettingCard>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("common.settings.provider")}
              </label>
              <Select
                value={settings.oss?.provider ?? "aliyun"}
                onValueChange={(value) =>
                  updateSettings(
                    appConfigShape.oss.provider,
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {t("common.settings.region")}
                </label>
                <Input
                  placeholder={t("common.settings.regionPlaceholder")}
                  value={settings.oss?.region ?? ""}
                  onChange={(e) =>
                    updateSettings(appConfigShape.oss.region, e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {t("common.settings.bucket")}
                </label>
                <Input
                  placeholder={t("common.settings.bucketPlaceholder")}
                  value={settings.oss?.bucket ?? ""}
                  onChange={(e) =>
                    updateSettings(appConfigShape.oss.bucket, e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("common.settings.accessKeyId")}
              </label>
              <Input
                placeholder={t("common.settings.accessKeyIdPlaceholder")}
                value={settings.oss?.access_key_id ?? ""}
                onChange={(e) =>
                  updateSettings(
                    appConfigShape.oss.access_key_id,
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("common.settings.accessKeySecret")}
              </label>
              <Input
                type="password"
                placeholder={t("common.settings.accessKeySecretPlaceholder")}
                value={settings.oss?.access_key_secret ?? ""}
                onChange={(e) =>
                  updateSettings(
                    appConfigShape.oss.access_key_secret,
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("common.settings.endpoint")}
              </label>
              <Input
                placeholder={t("common.settings.endpointPlaceholder")}
                value={settings.oss?.endpoint ?? ""}
                onChange={(e) =>
                  updateSettings(appConfigShape.oss.endpoint, e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("common.settings.customDomain")}
              </label>
              <Input
                placeholder={t("common.settings.customDomainPlaceholder")}
                value={settings.oss?.custom_domain ?? ""}
                onChange={(e) =>
                  updateSettings(
                    appConfigShape.oss.custom_domain,
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
      </SettingSection>
    </SettingsContainer>
  );
};
