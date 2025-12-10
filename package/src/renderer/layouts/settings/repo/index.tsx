import { useRepositoryStore } from "@/hooks/stores";
import { useViewManager } from "@/hooks/app/useViewManager";
import { useTranslation } from "react-i18next";
import { BasicSettings } from "./BasicSettings";
import { AssetSettings } from "./AssetSettings";
import { LinkSettings } from "./LinkSettings";
import { LlmTxtSettings } from "./LlmTxtSettings";
import { TrashSettings } from "./TrashSettings";

export const RepositorySettingsPanel = () => {
  const { t } = useTranslation();
  const repository = useRepositoryStore((state) => state.repository);
  const settingsSection =
    useViewManager((state) => state.previewCosmosId) || "basic";

  if (!repository) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t("common.repository.noRepositoryOpen")}
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (settingsSection) {
      case "asset":
        return <AssetSettings config={repository.config} />;
      case "link":
        return <LinkSettings config={repository.config} />;
      case "llmtxt":
        return <LlmTxtSettings />;
      case "trash":
        return <TrashSettings />;
      case "basic":
      default:
        return <BasicSettings config={repository.config} />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto">{renderContent()}</div>
    </div>
  );
};