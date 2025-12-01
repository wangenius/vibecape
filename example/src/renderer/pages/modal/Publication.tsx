import { context } from "@/components/custom/ContextMenu";
import { dialog } from "@/components/custom/DialogModal";
import { FormInput, FormContainer } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import NovelDeleteConfirm from "@/pages/modal/NovelDeleteConfirm";
import {
  useNovel,
  useNovelList,
  openNovel,
  createNovel,
} from "@/hook/novel/useNovel";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  TbArrowUpRight,
  TbBook2,
  TbDots,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { toast } from "sonner";
import { Novel } from "@common/schema/novel";

const NovelListItem = ({
  novel,
  active,
  openingNovel,
  onOpen,
}: {
  novel: Novel;
  active: boolean;
  openingNovel: string | null;
  onOpen: (id: string) => Promise<void>;
}) => {
  const [focus, setFocus] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => {
        if (openingNovel) return;
        onOpen(novel.id);
      }}
      className={cn(
        "group relative",
        "h-16 px-3 mx-1.5 my-1",
        "flex items-center gap-4",
        "rounded-xl",
        "transition-all duration-300 ease-in-out",
        "hover:bg-muted/80",
        "border border-transparent",
        active && ["bg-muted-foreground/20"],
        focus && "bg-muted border-border",
        openingNovel &&
          openingNovel !== novel.id &&
          "opacity-50 pointer-events-none saturate-50",
        openingNovel === novel.id && "bg-muted"
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        context({
          content: (close) => (
            <Menu
              items={[
                {
                  icon: TbArrowUpRight,
                  label: "打开",
                  onClick: () => {
                    onOpen(novel.id);
                    close();
                  },
                },
                {
                  icon: TbTrash,
                  label: "删除",
                  variant: "destructive",
                  onClick: () => {
                    NovelDeleteConfirm.open(novel);
                    close();
                  },
                },
              ]}
            />
          ),
          event: e,
          position: "cursor",
          x: 0,
          y: 0,
          afterClose: () => setFocus(false),
          beforeOpen: () => setFocus(true),
        });
      }}
    >
      <div className="relative flex-none">
        <div
          className={cn(
            "w-10 h-10 rounded-lg",
            "flex items-center justify-center",
            "transition-colors text-muted-foreground",
            active && "bg-primary text-primary-foreground"
          )}
        >
          <TbBook2 className="w-[18px] h-[18px]" />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium line-clamp-1",
              "transition-colors duration-200",
              active ? "text-foreground" : "text-foreground/90"
            )}
          >
            {novel.name || "未命名"}
          </span>
          {openingNovel === novel.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-2 py-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse" />
              <span className="text-[11px] font-medium tracking-wide">
                打开中
              </span>
            </motion.div>
          )}
        </div>
        <span className="text-xs text-muted-foreground/70">
          {new Date(novel.updated_at).toLocaleDateString()}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-200",
              "data-[state=open]:opacity-100",
              "data-[state=open]:bg-muted-foreground/10",
              "hover:bg-muted-foreground/10"
            )}
          >
            <TbDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="gap-2.5 py-2"
            onClick={() => onOpen(novel.id)}
          >
            <TbArrowUpRight className="h-4 w-4" />
            <span className="text-[13px]">打开</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              NovelDeleteConfirm.open(novel);
            }}
            variant="destructive"
            className="gap-2.5 py-2"
          >
            <TbTrash className="h-4 w-4" />
            <span className="text-[13px]">删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export const Publication = () => {
  const novels = useNovelList();
  const currentNovel = useNovel((state) => state);
  const [openingNovel, setOpeningNovel] = useState<string | null>(null);

  const handleOpenNovel = useCallback(
    async (id: string) => {
      if (openingNovel) return;
      try {
        setOpeningNovel(id);
        await openNovel(id);
      } catch (e) {
        console.error("打开小说失败:", e);
        toast.error("打开小说失败，请重试");
      } finally {
        setOpeningNovel(null);
      }
    },
    [openingNovel]
  );

  const novelList = useMemo(() => {
    return (
      <div className="space-y-2.5">
        <AnimatePresence>
          {Object.values(novels).map((novel) => (
            <NovelListItem
              key={novel.id}
              novel={novel}
              active={currentNovel?.id === novel.id}
              openingNovel={openingNovel}
              onOpen={handleOpenNovel}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }, [novels, currentNovel, openingNovel, handleOpenNovel]);

  return (
    <div id="publication-nav" className="flex flex-col h-full px-2">
      <div className="relative px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground tracking-tight">
              作品
            </h2>
            <p className="text-xs text-muted-foreground/90 mt-0.5">
              共 {Object.keys(novels).length} 部作品
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="hover:bg-muted">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => NovelCreateForm.open()}>
                <TbPlus />
                <span className="text-[13px]">新建小说</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <TbPlus />
                <span className="text-[13px]">新建智能体</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">{novelList}</div>
    </div>
  );
};

export const NovelCreateForm = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  return (
    <FormContainer
      onSubmit={async (data) => {
        try {
          setLoading(true);
          const novel = await createNovel({
            ...data,
          });
          if (novel) {
            await openNovel(novel.id);
          }
          onClose();
        } catch (e) {
          toast.error(String(e));
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-4">
        <FormInput
          autoFocus
          name="name"
          placeholder="请输入书名"
          className="h-9"
        />
        <Button
          type="submit"
          variant="default"
          disabled={loading}
          className="w-full h-9"
        >
          {loading ? "创建中..." : "确认创建"}
        </Button>
      </div>
    </FormContainer>
  );
};

NovelCreateForm.open = () => {
  dialog({
    title: "创建新书",
    className: "max-w-md",
    content: (close) => <NovelCreateForm onClose={close} />,
  });
};
