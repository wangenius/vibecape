import { create } from "zustand";
import { dialog } from "@/components/ui/dialog";
import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { useRepositoryStore } from "@/hooks/stores";

import { useTranslation } from "react-i18next";
import { AppSettingsPanel } from "./app";
import { RepositorySettingsPanel } from "./repo";
import { Button } from "@/components/ui/button";
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
    useViewManager((state) => state.settings_section) || "general";
  const repository = useRepositoryStore((state) => state.repository);

  return (
    <div className="w-80 flex flex-col p-2 border-r overflow-hidden shrink-0 h-full">
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Repo Settings - 仅当有 repository 时显示 */}
        {repository && (
          <>
            <div className="section-header">
              {t("common.settings.repoSettings")}
            </div>
            {REPOSITORY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key;
              return (
                <Button
                  key={item.key}
                  onClick={() => {
                    setViewManager({ settings_section: item.key });
                  }}
                  size="sidebar"
                  actived={isActive}
                >
                  <Icon />
                  <span>{t(item.labelKey)}</span>
                </Button>
              );
            })}
            <div className="my-xl w-full" />
          </>
        )}

        {/* App Settings */}
        <div>{t("common.settings.appSettings")}</div>
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
                setViewManager({ settings_section: item.key });
              }}
              size={"sidebar"}
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

const SettingsDialogContent = () => {
  const settingsSection = useViewManager((state) => state.settings_section);
  const repository = useRepositoryStore((state) => state.repository);

  return (
    <div className="flex h-full">
      <SettingsSidebar />
      <div className="flex-1 overflow-auto p-8">
        {repository && REPO_SETTINGS_KEYS.includes(settingsSection || "") ? (
          <RepositorySettingsPanel />
        ) : (
          <AppSettingsPanel />
        )}
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
    setViewManager({ settings_section: initialSection });
  } else {
    // 默认显示 general
    setViewManager({ settings_section: "general" });
  }

  const close = dialog({
    title: "",
    content: <SettingsDialogContent />,
    className: "w-[90vw] h-[90vh]",
    closeIconHide: true,
    onClose: () => {
      useSettingsDialogStore.setState({ isOpen: false, closeDialog: null });
    },
  });

  useSettingsDialogStore.setState({ isOpen: true, closeDialog: close });
}
