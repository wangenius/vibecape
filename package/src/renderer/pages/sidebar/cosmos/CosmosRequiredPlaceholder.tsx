import { useMemo } from "react";
import { useCosmos, openCosmos, deleteCosmos } from "@/hook/cosmos/useCosmos";
import { openCosmosNewTab } from "@/hook/app/useViewManager";
import { dialog } from "@/components/custom/DialogModal";
import { TbPlus, TbTrash } from "react-icons/tb";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// 格式化相对时间
const formatRelativeTime = (timestamp: number | null | undefined): string => {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
};

export const CosmosRequiredPlaceholder = () => {
  const cosmosList = useCosmos((state) => state.meta_list);

  const allCosmos = useMemo(() => {
    return Object.values(cosmosList).sort(
      (a, b) =>
        (b.last_opened_at ?? b.updated_at ?? 0) -
        (a.last_opened_at ?? a.updated_at ?? 0)
    );
  }, [cosmosList]);

  const handleDelete = (
    e: React.MouseEvent,
    cosmos: (typeof allCosmos)[number]
  ) => {
    e.stopPropagation();
    dialog.confirm({
      title: "删除世界观",
      content: `确定要删除「${cosmos.name || "未命名"}」吗？`,
      variants: "destructive",
      okText: "删除",
      onOk: async () => {
        try {
          await deleteCosmos(cosmos.id);
          toast.success("已删除");
        } catch {
          toast.error("删除失败");
        }
      },
    });
  };

  return (
    <div className="flex h-full flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-foreground/30" strokeWidth={1.5} />
          <span className="text-[11px] font-medium text-foreground/40 uppercase tracking-widest">
            Cosmos
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
          选择或创建世界观
        </p>
      </div>

      {/* Action */}
      <button
        onClick={() => openCosmosNewTab()}
        className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-foreground/4 hover:bg-foreground/7 text-foreground/70 text-[12px] font-medium transition-colors mb-6"
      >
        <TbPlus className="w-3.5 h-3.5" />
        新建世界观
      </button>

      {/* Cosmos List */}
      {allCosmos.length > 0 && (
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-px">
              {allCosmos.map((cosmos) => (
                <div
                  key={cosmos.id}
                  onClick={() => openCosmos(cosmos.id)}
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-foreground/3"
                >
                  <div className="w-6 h-6 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                    <Globe
                      className="w-3 h-3 text-foreground/25"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-[12px] text-foreground/70 font-medium">
                      {cosmos.name || "未命名"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/35">
                      {formatRelativeTime(
                        cosmos.last_opened_at ?? cosmos.updated_at
                      )}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, cosmos)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                  >
                    <TbTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty State */}
      {allCosmos.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-4 h-4 text-foreground/20" strokeWidth={1.5} />
            </div>
            <p className="text-[11px] text-muted-foreground/40">暂无世界观</p>
          </div>
        </div>
      )}
    </div>
  );
};
