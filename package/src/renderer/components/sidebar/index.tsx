import { motion } from "framer-motion";
import { useViewManager } from "@/hook/app/useViewManager";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { SidebarHeader } from "./SidebarHeader";
import { DocTreeWithDnd } from "./DocTreeView";
import { SettingsSidebar } from "./SettingsSidebar";
import { SidebarEmptyState } from "./SidebarEmptyState";
import { useCreateDocDialog } from "./useCreateDocDialog";

export const Sidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const workspace = useVibecapeStore((state) => state.workspace);
  const handleCreateDoc = useCreateDocDialog();
  const isSettingsMode = activeSidebarPanel === "settings";

  return (
    <motion.div
      id="vibecape-sidebar"
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
        <div className="h-full w-[360px] flex flex-col bg-accent overflow-hidden pt-10">
          <SidebarHeader onCreateDoc={handleCreateDoc} />
          {workspace?.initialized ? <DocTreeWithDnd /> : <SidebarEmptyState />}
        </div>
      )}
    </motion.div>
  );
};
