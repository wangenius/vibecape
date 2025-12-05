import { cn } from "@/lib/utils";
import { useChatStore } from "@/hooks/chat/useChat";
import type { ChatThreadMeta } from "@common/schema/chat";
import { useTranslation } from "react-i18next";

interface ThreadListItemProps {
  thread: ChatThreadMeta;
  isActive: boolean;
  onSelect: (threadId: string) => void;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isActive,
  onSelect,
}) => {
  const { t } = useTranslation();
  const chatStatus = useChatStore(
    (state) => state.chats.get(thread.id)?.status
  );
  const isStreaming = chatStatus === "streaming" || chatStatus === "submitted";

  return (
    <button
      onClick={() => onSelect(thread.id)}
      className={cn(
        "w-full rounded-md px-2 py-1.5 text-left transition",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isStreaming && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </span>
          )}
          <span className="truncate text-[11px] font-medium">
            {thread.title || t("chat.thread.untitled")}
          </span>
        </div>
      </div>
    </button>
  );
};
