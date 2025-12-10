import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/hooks/stores";
import { useTranslation } from "react-i18next";
import {
  SettingSection,
  SettingCard,
} from "@/layouts/settings/item/SettingComponents";
import type { DocData } from "@common/schema/docs";
import { format } from "date-fns";
import {
  TbRefresh,
  TbTrash,
  TbTrashX,
  TbRotateClockwise,
} from "react-icons/tb";

export const TrashSettings = () => {
  const { t } = useTranslation();
  const [trashItems, setTrashItems] = useState<DocData[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshTree = useDocumentStore((state) => state.refreshTree);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const items = await window.api.vibecape.getTrash();
      setTrashItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (id: string) => {
    try {
      await window.api.vibecape.restoreDoc(id);
      await loadTrash();
      await refreshTree();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePermanently = async (id: string) => {
    if (!confirm(t("common.repository.deletePermanentlyConfirm"))) {
      return;
    }
    try {
      await window.api.vibecape.deletePermanently(id);
      await loadTrash();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm(t("common.repository.emptyTrashConfirm"))) {
      return;
    }
    try {
      await window.api.vibecape.emptyTrash();
      await loadTrash();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.repository.trash")}
        description={t("common.repository.trashDesc")}
      >
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTrash}
            disabled={loading}
          >
            <TbRefresh
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {t("common.repository.refreshHistory")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmptyTrash}
            disabled={trashItems.length === 0 || loading}
          >
            <TbTrashX className="mr-2 h-4 w-4" />
            {t("common.repository.emptyTrash")}
          </Button>
        </div>

        <SettingCard>
          {trashItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TbTrash className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>{t("common.repository.noTrashItems")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trashItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("common.repository.delete")}:{" "}
                      {item.deleted_at
                        ? format(item.deleted_at, "yyyy-MM-dd HH:mm:ss")
                        : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRestore(item.id)}
                      title={t("common.repository.restore")}
                    >
                      <TbRotateClockwise className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeletePermanently(item.id)}
                      title={t("common.repository.deletePermanently")}
                    >
                      <TbTrashX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingCard>
      </SettingSection>
    </div>
  );
};
