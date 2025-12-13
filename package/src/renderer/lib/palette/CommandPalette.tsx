import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings,
  Moon,
  Sun,
  MessageSquare,
  PanelLeft,
  BarChart3,
} from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { Palette } from "@/lib/palette/base";
import {
  toggleLeftSidebar,
  toggleBayBar
} from "@/hooks/app/useViewManager";
import { openSettingsDialog } from "@/layouts/settings";
import { useSettings, updateSettings } from "@/hooks/app/useSettings";
import { createShape } from "@common/lib/shape";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";
import { usePaletteStore } from "@/hooks/shortcuts/usePalette";

const appConfigShape = createShape(DEFAULT_APP_CONFIG);

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  extraCommands?: CommandItem[];
}

export const CommandPalette = ({ extraCommands = [] }: CommandPaletteProps) => {
  const { t } = useTranslation();
  const mode = useSettings((state) => state.ui.mode);
  const open = usePaletteStore((state) => state.activePalette === "command");
  const closePalette = usePaletteStore((state) => state.closePalette);

  // 执行命令并关闭面板
  const runCommand = useCallback(
    (action: () => void) => {
      closePalette();
      action();
    },
    [closePalette]
  );

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newMode = mode === "dark" ? "light" : "dark";
    void updateSettings(appConfigShape.ui.mode, newMode);
  }, [mode]);

  // 内置命令列表
  const builtinCommands: CommandItem[] = [
    // 导航命令
    {
      id: "toggle-settings",
      label: t("command.toggleSettings", "切换设置面板"),
      icon: <Settings className="h-4 w-4" />,
      shortcut: "⌘,",
      action: () => openSettingsDialog(),
      group: "navigation",
      keywords: ["settings", "preferences", "设置", "偏好"],
    },
    {
      id: "open-stats",
      label: t("command.openStats", "打开统计"),
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {},
      group: "navigation",
      keywords: ["stats", "statistics", "统计", "数据"],
    },
    // 视图命令
    {
      id: "toggle-sidebar",
      label: t("command.toggleSidebar", "切换侧边栏"),
      icon: <PanelLeft className="h-4 w-4" />,
      shortcut: "⌘B",
      action: () => toggleLeftSidebar(),
      group: "view",
      keywords: ["sidebar", "panel", "侧边栏", "面板"],
    },
    {
      id: "toggle-chat",
      label: t("command.toggleChat", "切换聊天面板"),
      icon: <MessageSquare className="h-4 w-4" />,
      shortcut: "⌘L",
      action: () => toggleBayBar(),
      group: "view",
      keywords: ["chat", "ai", "聊天", "对话"],
    },
    // 主题命令
    {
      id: "toggle-theme",
      label:
        mode === "dark"
          ? t("command.lightMode", "切换到浅色模式")
          : t("command.darkMode", "切换到深色模式"),
      icon:
        mode === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        ),
      action: toggleTheme,
      group: "appearance",
      keywords: ["theme", "dark", "light", "主题", "深色", "浅色"],
    },
  ];

  // 合并内置命令和额外命令
  const allCommands = [...builtinCommands, ...extraCommands];

  // 按组分类命令
  const groupedCommands = allCommands.reduce(
    (acc, cmd) => {
      const group = cmd.group || "other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  // 组名映射
  const groupLabels: Record<string, string> = {
    navigation: t("command.group.navigation", "导航"),
    view: t("command.group.view", "视图"),
    appearance: t("command.group.appearance", "外观"),
    other: t("command.group.other", "其他"),
  };

  return (
    <Palette
      open={open}
      onOpenChange={(open) => !open && closePalette()}
      placeholder={t("command.searchPlaceholder", "输入命令...")}
    >
      <CommandEmpty>{t("command.noResults", "没有找到相关命令")}</CommandEmpty>
      {Object.entries(groupedCommands).map(([group, commands]) => (
        <CommandGroup key={group} heading={groupLabels[group] || group}>
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={`${cmd.label} ${cmd.keywords?.join(" ") || ""}`}
              onSelect={() => runCommand(cmd.action)}
            >
              {cmd.icon && (
                <span className="mr-2 text-muted-foreground">{cmd.icon}</span>
              )}
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </Palette>
  );
};
