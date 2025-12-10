import { List, FolderTree } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-xs">
      {tabs.map((tab) => {
        const isActive = mode === tab.id;
        const Icon = tab.icon;

        return (
          <Button
            key={tab.id}
            size={"icon"}
            onClick={() => onModeChange(tab.id)}
            actived={isActive}
            title={t(tab.titleKey)}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
};
