import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingCard,
  SettingsContainer,
} from "@/layouts/settings/item/SettingComponents";
import { useDebounce } from "@/hooks/util/useDebounce";
import Textarea from "@/components/ui/textarea";

export const LlmTxtSettings = () => {
  const { t } = useTranslation();
  const [llmTxt, setLlmTxt] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.api.vibecape
      .getLlmTxt()
      .then((content) => {
        setLlmTxt(content);
        setLoaded(true);
      })
      .catch(console.error);
  }, []);

  const debouncedChange = useDebounce(async (value: string) => {
    await window.api.vibecape.setLlmTxt(value);
  }, 500);

  if (!loaded) {
    return null;
  }

  return (
    <SettingsContainer>
      <SettingSection
        title={t("common.repository.aiContext")}
        description={t("common.repository.llmTxtDesc")}
      >
        <SettingCard>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("common.repository.llmTxt")}
            </label>
            <Textarea
              value={llmTxt}
              onChange={(value) => debouncedChange(value)}
              placeholder={t("common.repository.llmTxtPlaceholder")}
              hasError={false}
              autoFocus={false}
            />
          </div>
        </SettingCard>
      </SettingSection>
    </SettingsContainer>
  );
};
