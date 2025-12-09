import { create } from "zustand";
import { dialog } from "@/components/custom/DialogModal";
import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import { cn } from "@/lib/utils";
import {
  SETTINGS_NAV_ITEMS,
  WORKSPACE_NAV_ITEMS,
} from "@/components/docs/constants";
import { useTranslation } from "react-i18next";
import { AppSettingsPanel } from "./app";
import { WorkspaceSettingsPanel } from "./repo";

// Repo Settings 的 key 列表
const REPO_SETTINGS_KEYS = ["basic", "asset", "link", "llmtxt", "trash"];

const SettingsSidebar = () => {
  const { t } = useTranslation();
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";
  const workspace = useWorkspaceStore((state) => state.workspace);

  return (
    <div className="w-60 flex flex-col border-r border-border overflow-hidden shrink-0">
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Repo Settings - 仅当有 workspace 时显示 */}
        {workspace && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("common.settings.repoSettings")}
            </div>
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setViewManager({ previewCosmosId: item.key });
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
            <div className="my-5 w-full" />
          </>
        )}

        {/* App Settings */}
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("common.settings.appSettings")}
        </div>
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.key;
          const labelKey =
            item.key === "storage"
              ? "cloudStorage"
              : item.key === "ai"
                ? "aiLabel"
                : item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setViewManager({ previewCosmosId: item.key });
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{t(`common.settings.${labelKey}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SettingsContent = () => {
  const settingsSection = useViewManager((state) => state.previewCosmosId);
  const workspace = useWorkspaceStore((state) => state.workspace);

  // 如果是 Repo Settings 的 key 且有 workspace，显示 WorkspaceSettingsPanel
  if (workspace && REPO_SETTINGS_KEYS.includes(settingsSection || "")) {
    return <WorkspaceSettingsPanel />;
  }

  return <AppSettingsPanel />;
};

const SettingsDialogContent = () => {
  return (
    <div className="flex h-full">
      <SettingsSidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsContent />
      </div>
    </div>
  );
};

// 设置对话框状态管理
interface SettingsDialogState {
  isOpen: boolean;
  closeDialog: (() => void) | null;
}

const useSettingsDialogStore = create<SettingsDialogState>(() => ({
  isOpen: false,
  closeDialog: null,
}));

export function openSettingsDialog(initialSection?: string) {
  const { isOpen, closeDialog } = useSettingsDialogStore.getState();

  // 如果已经打开，则关闭
  if (isOpen && closeDialog) {
    closeDialog();
    return;
  }

  // 设置初始 section
  if (initialSection) {
    setViewManager({ previewCosmosId: initialSection });
  } else {
    // 默认显示 general
    setViewManager({ previewCosmosId: "general" });
  }

  const close = dialog({
    title: "",
    content: <SettingsDialogContent />,
    className: "w-[90vw] h-[90vh] p-0",
    closeIconHide: true,
    onClose: () => {
      useSettingsDialogStore.setState({ isOpen: false, closeDialog: null });
    },
  });

  useSettingsDialogStore.setState({ isOpen: true, closeDialog: close });
}
