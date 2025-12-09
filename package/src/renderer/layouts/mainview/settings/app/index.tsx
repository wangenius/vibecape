import { useViewManager } from "@/hooks/app/useViewManager";
import { GeneralSettings } from "./GeneralSettings";
import { ModelSettings } from "./ModelSettings";
import { AISettings } from "./AISettings";
import { PromptSettings } from "./PromptSettings";
import { MCPSettings } from "./MCPSettings";
import { StorageSettings } from "./StorageSettings";
import { AboutSettings } from "./AboutSettings";

export const AppSettingsPanel = () => {
  const settingsSection = useViewManager((state) => state.previewCosmosId);

  switch (settingsSection) {
    case "models":
      return <ModelSettings />;
    case "ai":
      return <AISettings />;
    case "prompts":
      return <PromptSettings />;
    case "mcp":
      return <MCPSettings />;
    case "storage":
      return <StorageSettings />;
    case "about":
      return <AboutSettings />;
    case "general":
    default:
      return <GeneralSettings />;
  }
};
