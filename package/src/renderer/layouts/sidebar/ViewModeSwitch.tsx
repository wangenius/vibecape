import { List, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ViewMode = "tree" | "toc";

interface ViewModeSwitchProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const tabs: { id: ViewMode; icon: typeof FolderTree; titleKey: string }[] = [
  { id: "tree", icon: FolderTree, titleKey: "common.sidebar.docs" },
  { id: "toc", icon: List, titleKey: "common.sidebar.toc" },
];

export const ViewModeSwitch = ({ mode, onModeChange }: ViewModeSwitchProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = mode === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            className={cn(
              "size-7 flex items-center justify-center rounded-md transition-colors hover:bg-muted-foreground/10",
              isActive && "bg-muted-foreground/10"
            )}
            title={t(tab.titleKey)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
};
