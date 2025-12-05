import { motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useViewManager, toggleBayBar } from "@/hooks/app/useViewManager";
import { ChatPanel } from "@/features/chat";

export const Baybar = () => {
  const isBayBarOpen = useViewManager((state) => state.isBayBarOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 使用 Ctrl+Shift+B 来切换 Baybar
      if (e.key.toLowerCase() === "b" && e.ctrlKey && e.shiftKey) {
        toggleBayBar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{
        width: isBayBarOpen ? "400px" : "0px",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        "flex-none h-full overflow-hidden border-l border-muted-foreground/20",
        !isBayBarOpen && "pointer-events-none"
      )}
    >
      <div className="h-full w-[400px] flex flex-col overflow-hidden">
        <ChatPanel />
      </div>
    </motion.div>
  );
};
