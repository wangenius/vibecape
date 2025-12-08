import { TbHistory } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThreadListItem } from "./ThreadListItem";
import type { ChatThreadMeta } from "@common/schema/chat";

interface HistoryPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadList: ChatThreadMeta[];
  activeChatId: string | null | undefined;
  historyLoading: boolean;
  onSelectThread: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
}

export const HistoryPopover: React.FC<HistoryPopoverProps> = ({
  open,
  onOpenChange,
  threadList,
  activeChatId,
  historyLoading,
  onSelectThread,
  onDeleteThread,
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="历史会话"
        >
          <TbHistory className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-2"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="px-2 py-1">
            <h4 className="text-xs font-medium text-foreground">
              历史对话
            </h4>
            <p className="text-[10px] text-muted-foreground">
              切换到之前的对话
            </p>
          </div>
          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
            {historyLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                加载中...
              </div>
            ) : threadList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                还没有历史记录
              </div>
            ) : (
              threadList.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeChatId}
                  onSelect={onSelectThread}
                  onDelete={onDeleteThread}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
