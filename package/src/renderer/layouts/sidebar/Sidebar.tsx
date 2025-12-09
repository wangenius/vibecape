import { motion } from "framer-motion";
import { useViewManager } from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import { SidebarHeader } from "./SidebarHeader";
import {
  DocTreeWithDnd,
  DocTocView,
  useCreateDocDialog,
} from "@/components/docs";
import { SidebarEmptyState } from "./SidebarEmptyState";

export const Sidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const sidebarViewMode = useViewManager(
    (selector) => selector.sidebarViewMode
  );
  const workspace = useWorkspaceStore((state) => state.workspace);
  const handleCreateDoc = useCreateDocDialog();
  if (!workspace) {
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
        className="h-full flex select-none overflow-hidden whitespace-nowrap"
      >
        <div className="h-full w-[360px] flex flex-col border-r border-border overflow-hidden">
          <SidebarEmptyState />
        </div>
      </motion.div>
    );
  }

  const renderContent = () => {
    switch (sidebarViewMode) {
      case "toc":
        return <DocTocView />;
      case "tree":
      default:
        return <DocTreeWithDnd />;
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
      <div className="h-full w-[360px] flex flex-col border-r border-border overflow-hidden">
        <SidebarHeader onCreateDoc={handleCreateDoc} />
        {renderContent()}
      </div>
    </motion.div>
  );
};
