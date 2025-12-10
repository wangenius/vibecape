import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useViewManager } from "@/hooks/app/useViewManager";
import { ChatPanel } from "@/lib/chat";

export const Baybar = () => {
  const isBayBarOpen = useViewManager((state) => state.isBayBarOpen);

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
