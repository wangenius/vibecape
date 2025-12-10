import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingCard,
} from "@/layouts/settings/item/SettingComponents";
import { useDebounce, updateLlmTxt } from "./hooks";

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

  const debouncedChange = useDebounce((value: string) => {
    void updateLlmTxt(value);
  }, 500);

  if (!loaded) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.repository.aiContext")}
        description={t("common.repository.llmTxtDesc")}
      >
        <SettingCard>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("common.repository.llmTxt")}
            </label>
            <textarea
              defaultValue={llmTxt}
              onChange={(e) => debouncedChange(e.target.value)}
              placeholder={t("common.repository.llmTxtPlaceholder")}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </SettingCard>
      </SettingSection>
    </div>
  );
};
