import { useViewManager } from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import { AppSettingsPanel } from "./app";
import { WorkspaceSettingsPanel } from "./repo";

// Repo Settings 的 key 列表
const REPO_SETTINGS_KEYS = ["basic", "asset", "link", "llmtxt", "trash"];

export const SettingsPanel = () => {
  const settingsSection = useViewManager((state) => state.previewCosmosId);
  const workspace = useWorkspaceStore((state) => state.workspace);

  // 如果是 Repo Settings 的 key 且有 workspace，显示 WorkspaceSettingsPanel
  if (workspace && REPO_SETTINGS_KEYS.includes(settingsSection || "")) {
    return <WorkspaceSettingsPanel />;
  }

  return <AppSettingsPanel />;
};
