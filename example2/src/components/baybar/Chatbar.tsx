"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SimpleChatPanel } from "@/components/baybar/simple-chat-panel";
import { cn } from "@/lib/utils";
import { useView } from "@/hook/useView";
import { useEffect, useState } from "react";

export function Chatbar() {
  const { isBayBarOpen } = useView();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 移动端：全屏模式
  if (isMobile) {
    return (
      <AnimatePresence>
        {isBayBarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-12 bottom-0 z-40 bg-background md:hidden"
          >
            {/* 聊天面板内容 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full relative"
            >
              <SimpleChatPanel />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 桌面端：侧边栏模式
  return (
    <motion.div
      initial={false}
      animate={{
        width: isBayBarOpen ? "480px" : "0px",
        opacity: isBayBarOpen ? 1 : 0,
      }}
      transition={{
        width: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        },
        opacity: {
          duration: 0.2,
          ease: "easeInOut",
        },
      }}
      className={cn(
        "hidden md:block h-full overflow-hidden",
        !isBayBarOpen && "pointer-events-none"
      )}
    >
      <AnimatePresence mode="wait">
        {isBayBarOpen && (
          <motion.div
            key="chat-panel"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="h-full"
          >
            <SimpleChatPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
