import { create } from "zustand";
import { dialog } from "@/components/ui/DialogModal";
import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { useRepositoryStore } from "@/hooks/stores";

import { useTranslation } from "react-i18next";
import { AppSettingsPanel } from "./app";
import { RepositorySettingsPanel } from "./repo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TbSettings,
  TbBox,
  TbInfoCircle,
  TbCloud,
  TbFileText,
  TbUpload,
  TbLink,
  TbPlug,
  TbSparkles,
  TbTrash,
  TbPrompt,
} from "react-icons/tb";

export const DRAG_HOVER_DELAY = 800;
export const INDENT_WIDTH = 24;

// 节点样式
export const nodeBaseStyles = {
  base: cn(
    "group relative flex items-center gap-2 py-1 pl-1 pr-1 rounded-lg mx-1",
    "transition-all duration-200 ease-out",
    "cursor-pointer",
    "border border-transparent",
    "hover:bg-muted-foreground/5"
  ),
  selected: ["bg-primary/5 hover:bg-primary/8"],
  dragging: ["opacity-50"],
};

// 设置导航项
export const SETTINGS_NAV_ITEMS = [
  { key: "general", label: "通用", icon: TbSettings },
  { key: "models", label: "模型", icon: TbBox },
  { key: "ai", label: "AI", icon: TbSparkles },
  { key: "prompts", label: "Prompts", icon: TbPrompt },
  { key: "mcp", label: "MCP", icon: TbPlug },
  { key: "storage", label: "云存储", icon: TbCloud },
  { key: "about", label: "关于", icon: TbInfoCircle },
];

// 工作区设置导航项
export const REPOSITORY_NAV_ITEMS = [
  { key: "basic", labelKey: "common.repository.basicInfo", icon: TbSettings },
  { key: "asset", labelKey: "common.repository.assetSettings", icon: TbUpload },
  { key: "link", labelKey: "common.repository.linkSettings", icon: TbLink },
  { key: "llmtxt", labelKey: "common.repository.aiContext", icon: TbFileText },
  { key: "trash", labelKey: "common.repository.trash", icon: TbTrash },
];

// Repo Settings 的 key 列表
const REPO_SETTINGS_KEYS = ["basic", "asset", "link", "llmtxt", "trash"];

const SettingsSidebar = () => {
  const { t } = useTranslation();
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";
  const repository = useRepositoryStore((state) => state.repository);

  return (
    <div className="w-60 flex flex-col border-r border-border overflow-hidden shrink-0">
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Repo Settings - 仅当有 repository 时显示 */}
        {repository && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("common.settings.repoSettings")}
            </div>
            {REPOSITORY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key;
              return (
                <Button
                  key={item.key}
                  onClick={() => {
                    setViewManager({ previewCosmosId: item.key });
                  }}
                  size="full"
                  actived={isActive}
                >
                  <Icon />
                  <span>{t(item.labelKey)}</span>
                </Button>
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
            <Button
              key={item.key}
              onClick={() => {
                setViewManager({ previewCosmosId: item.key });
              }}
              size={"full"}
              actived={isActive}
            >
              <Icon />
              <span>{t(`common.settings.${labelKey}`)}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

const SettingsContent = () => {
  const settingsSection = useViewManager((state) => state.previewCosmosId);
  const repository = useRepositoryStore((state) => state.repository);

  // 如果是 Repo Settings 的 key 且有 repository，显示 RepositorySettingsPanel
  if (repository && REPO_SETTINGS_KEYS.includes(settingsSection || "")) {
    return <RepositorySettingsPanel />;
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
