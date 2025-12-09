import { motion } from "framer-motion";
import { useViewManager } from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import { SidebarHeader } from "./SidebarHeader";
import {
  DocTreeWithDnd,
  DocTocView,
  useCreateDocDialog,
} from "@/components/docs";
import { SettingsSidebar } from "./SettingsSidebar";
import { SidebarEmptyState } from "./SidebarEmptyState";

export const Sidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const sidebarViewMode = useViewManager(
    (selector) => selector.sidebarViewMode
  );
  const workspace = useWorkspaceStore((state) => state.workspace);
  const handleCreateDoc = useCreateDocDialog();
  const isSettingsMode = activeSidebarPanel === "settings";

  const renderContent = () => {
    if (!workspace) {
      return <SidebarEmptyState />;
    }

    switch (sidebarViewMode) {
      case "toc":
        return <DocTocView />;
      case "tree":
      default:
        return (
          <>
            <SidebarHeader onCreateDoc={handleCreateDoc} />
            <DocTreeWithDnd />
          </>
        );
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isSidebarCollapsed ? "0px" : "360px",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="h-full flex select-none overflow-hidden"
    >
      {isSettingsMode ? (
        <SettingsSidebar />
      ) : (
        <div className="h-full w-[360px] flex flex-col border-r border-border overflow-hidden">
          {renderContent()}
        </div>
      )}
    </motion.div>
  );
};
