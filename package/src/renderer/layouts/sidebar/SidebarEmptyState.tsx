import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRepositoryStore, useUIStore } from "@/hooks/stores";
import { Loader2, Trash2, Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { dialog } from "@/components/ui/dialog";
import { TbCheck, TbX } from "react-icons/tb";

export const SidebarEmptyState = () => {
  const { t } = useTranslation();
  const loading = useUIStore((state) => state.loading);
  const listLoading = useUIStore((state) => state.listLoading);
  const repositoryList = useRepositoryStore((state) => state.repositoryList);
  const createRepository = useRepositoryStore((state) => state.createRepository);
  const openRepository = useRepositoryStore((state) => state.openRepository);
  const deleteRepository = useRepositoryStore((state) => state.deleteRepository);

  const handleOpenRepository = async (id: string) => {
    try {
      await openRepository(id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteRepository = async (id: string, name: string) => {
    dialog.confirm({
      title: t("common.repository.deleteRepository"),
      content: (
        <p className="text-sm text-muted-foreground">
          {t("common.repository.deleteConfirm", { name })}
        </p>
      ),
      variants: "destructive",
      okText: t("common.delete"),
      onOk: async () => {
        try {
          await deleteRepository(id);
          toast.success(t("common.repository.repositoryDeleted"));
        } catch (error) {
          toast.error((error as Error).message);
        }
      },
    });
  };

  const handleCreateRepository = () => {
    let inputValue = "";

    dialog({
      title: t("common.repository.createRepository"),
      className: "max-w-[400px]",
      content: (close) => (
        <div className="space-y-4">
          <Input
            placeholder={t("common.repository.repositoryName")}
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                try {
                  const result = await createRepository(inputValue.trim());
                  if (result) {
                    toast.success(t("common.repository.repositoryCreated"));
                    close();
                  }
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }
            }}
            autoFocus
          />
        </div>
      ),
      footer: (close) => (
        <div className="btn-group">
          <Button variant="ghost" size="sm" onClick={close}>
            <TbX />
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              if (!inputValue.trim()) return;
              try {
                const result = await createRepository(inputValue.trim());
                if (result) {
                  toast.success(t("common.repository.repositoryCreated"));
                  close();
                }
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          >
            <TbCheck />
            {t("common.create")}
          </Button>
        </div>
      ),
    });
  };

  return (
    <div className="flex-1 flex flex-col select-none p-3 overflow-hidden">
      {/* 顶部新建按钮 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {t("common.repository.recentTitle")}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateRepository}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          {t("common.repository.createRepository")}
        </Button>
      </div>

      {/* 工作区列表 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {listLoading ? (
          <div className="flex-center py-lg">
            <Loader2 className="animate-spin" />
          </div>
        ) : repositoryList.length === 0 ? (
          <div className="flex-center-col py-xl">
            <FolderOpen className="mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("common.repository.noHistory")}
            </p>
          </div>
        ) : (
          repositoryList.map((item) => (
            <div
              key={item.id}
              className="list-item"
              onClick={() => void handleOpenRepository(item.id)}
            >
              <FolderOpen className="size-icon-md text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-truncate">{item.name}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
className="hover-visible shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteRepository(item.id, item.name);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
