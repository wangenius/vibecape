import { motion } from "framer-motion";
import { List, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarViewMode } from "@/hook/app/useViewManager";

interface ViewModeSwitchProps {
  mode: SidebarViewMode;
  onModeChange: (mode: SidebarViewMode) => void;
}

const tabs: { id: SidebarViewMode; icon: typeof FolderTree; label: string }[] =
  [
    { id: "tree", icon: FolderTree, label: "文档" },
    { id: "toc", icon: List, label: "目录" },
  ];

export const ViewModeSwitch = ({ mode, onModeChange }: ViewModeSwitchProps) => {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center gap-1 p-1 rounded-lg">
        {tabs.map((tab) => {
          const isActive = mode === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "text-sidebar-accent-foreground"
                  : "text-muted-foreground/70 hover:text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-view-mode-bg"
                  className="absolute inset-0 bg-muted-foreground/10 rounded-md shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <Icon className="relative z-10 size-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
