import { cn } from "@/lib/utils";
import { useChatStore } from "@/hooks/chat/useChat";
import type { ChatThreadMeta } from "@common/schema/chat";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface ThreadListItemProps {
  thread: ChatThreadMeta;
  isActive: boolean;
  onSelect: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isActive,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const chatStatus = useChatStore(
    (state) => state.chats.get(thread.id)?.status
  );
  const isStreaming = chatStatus === "streaming" || chatStatus === "submitted";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(thread.id);
  };

  return (
    <div
      className={cn(
        "group relative w-full rounded-md px-2 py-1.5 text-left transition cursor-pointer",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
      onClick={() => onSelect(thread.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        {isHovered && onDelete && (
          <button
            onClick={handleDelete}
            className="shrink-0 rounded text-xs hover:text-destructive transition-colors"
            title={t("common.delete")}
          >
            delete
          </button>
        )}
      </div>
    </div>
  );
};
