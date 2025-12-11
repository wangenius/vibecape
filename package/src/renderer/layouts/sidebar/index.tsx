import { motion } from "framer-motion";
import { useViewManager } from "@/hooks/app/useViewManager";
import { useRepositoryStore } from "@/hooks/stores";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarEmptyState } from "./SidebarEmptyState";
import { DocTocView } from "./DocTocView";
import { DocTreeWithDnd } from "./DocTreeView";

const SidebarContainer = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
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
      <div className="h-full p-1 w-[360px] flex flex-col border-r border-border overflow-hidden gap-2">
        {children}
      </div>
    </motion.div>
  );
};

export const Sidebar = () => {
  const sidebarViewMode = useViewManager(
    (selector) => selector.sidebarViewMode
  );
  const repository = useRepositoryStore((state) => state.repository);

  if (!repository) {
    return (
      <SidebarContainer>
        <SidebarEmptyState />
      </SidebarContainer>
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
    <SidebarContainer>
      <SidebarHeader />
      {renderContent()}
    </SidebarContainer>
  );
};
