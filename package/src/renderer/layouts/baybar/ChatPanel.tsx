import { useState, useCallback, useEffect } from "react";
import { TbPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useThread } from "@/hooks/chat/useThread";
import { useHero } from "@/hooks/chat/useHero";
import { ChatCore } from "./ChatCore";
import { HeroSelector } from "../../components/chat/components/HeroSelector";
import { HistoryPopover } from "../../components/chat/components/HistoryPopover";
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
    deleteThread,
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
      console.log("[ChatPanel] handleSelectHero called:", heroId);
      setCurrentHeroId(heroId);
      // 注意：AgentSelector 内部已经调用 onOpenChange(false) 关闭 popover
    },
    [setCurrentHeroId]
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-transparent">
      {/* 顶部固定栏 */}
      <div className="flex h-10 flex-none items-center justify-between px-2">
        {/* 左侧：Agent 切换 */}
        <HeroSelector
          open={agentOpen}
          onOpenChange={setAgentOpen}
          heroes={heroes}
          currentHero={currentHero}
          onSelect={handleSelectHero}
        />

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleSelectThread(undefined)}
            title={t("chat.thread.newChat")}
          >
            <TbPlus />
          </Button>

          <HistoryPopover
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            threadList={threadList}
            activeChatId={activeChatId}
            historyLoading={historyLoading}
            onSelectThread={(threadId) => void handleSelectThread(threadId)}
            onDeleteThread={deleteThread}
          />
        </div>
      </div>

      {/* 聊天核心组件 */}
      {isInitializing ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("chat.thread.initializing")}
          </div>
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
