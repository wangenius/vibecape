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
export const WORKSPACE_NAV_ITEMS = [
  { key: "basic", labelKey: "common.workspace.basicInfo", icon: TbSettings },
  { key: "asset", labelKey: "common.workspace.assetSettings", icon: TbUpload },
  { key: "link", labelKey: "common.workspace.linkSettings", icon: TbLink },
  { key: "llmtxt", labelKey: "common.workspace.aiContext", icon: TbFileText },
  { key: "trash", labelKey: "common.workspace.trash", icon: TbTrash },
];
