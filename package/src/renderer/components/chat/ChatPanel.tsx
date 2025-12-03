import { useState, useCallback, useEffect } from "react";
import { TbPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useThread } from "@/hook/chat/useThread";
import { useHero } from "@/hook/chat/useHero";
import { ChatCore } from "./ChatCore";
import { AgentSelector } from "./AgentSelector";
import { HistoryPopover } from "./HistoryPopover";
import { useTranslation } from "react-i18next";

export const ChatPanel = () => {
  const { t } = useTranslation();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  
  const {
    activeChatId,
    historyLoading,
    threadList,
    isInitializing,
    refreshThreads,
    selectThread,
  } = useThread();

  const { heroes, currentHero, setCurrentHeroId } = useHero();

  useEffect(() => {
    if (historyOpen) {
      void refreshThreads();
    }
  }, [historyOpen, refreshThreads]);

  const handleSelectThread = useCallback(
    async (targetThreadId?: string) => {
      setHistoryOpen(false);
      await selectThread(targetThreadId);
    },
    [selectThread]
  );

  const handleSelectHero = useCallback(
    (heroId: string) => {
      setCurrentHeroId(heroId);
      setAgentOpen(false);
    },
    [setCurrentHeroId]
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-transparent">
      {/* 顶部固定栏 */}
      <div className="flex h-10 flex-none items-center justify-between px-2">
        {/* 左侧：Agent 切换 */}
        <AgentSelector
          open={agentOpen}
          onOpenChange={setAgentOpen}
          agents={heroes}
          currentAgent={currentHero}
          onSelect={handleSelectHero}
        />

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => void handleSelectThread(undefined)}
            title={t("chat.thread.newChat")}
          >
            <TbPlus className="h-3.5 w-3.5" />
          </Button>

          <HistoryPopover
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            threadList={threadList}
            activeChatId={activeChatId}
            historyLoading={historyLoading}
            onSelectThread={(threadId) => void handleSelectThread(threadId)}
          />
        </div>
      </div>

      {/* 聊天核心组件 */}
      {isInitializing ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">{t("chat.thread.initializing")}</div>
        </div>
      ) : activeChatId ? (
        <ChatCore key={activeChatId} chatId={activeChatId} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("chat.thread.loadFailed")}
          </div>
        </div>
      )}

    </div>
  );
};
