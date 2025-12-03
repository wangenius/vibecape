import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const useCreateDocDialog = () => {
  const { t } = useTranslation();
  const createDoc = useVibecapeStore((state) => state.createDoc);

  return useCallback(
    (parentId: string | null) => {
      let title = "";
      dialog({
        title: t("common.settings.newDoc"),
        className: "max-w-sm",
        content: (
          <Input
            placeholder={t("common.settings.docNamePlaceholder")}
            onChange={(e) => (title = e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                e.preventDefault();
                const btn = document.querySelector(
                  "[data-create-doc-btn]"
                ) as HTMLButtonElement;
                btn?.click();
              }
            }}
          />
        ),
        footer: (close) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              {t("common.actions.cancel")}
            </Button>
            <Button
              size="sm"
              data-create-doc-btn
              onClick={async () => {
                if (!title.trim()) {
                  toast.error(t("common.settings.enterDocName"));
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    title: title.trim(),
                  });
                  toast.success(t("common.settings.docCreated"));
                  close();
                } catch (error: any) {
                  toast.error(
                    error?.message ?? t("common.settings.createFailed")
                  );
                }
              }}
            >
              {t("common.settings.create")}
            </Button>
          </div>
        ),
      });
    },
    [createDoc, t]
  );
};
