import { useCallback } from "react";
import { useDocumentStore } from "@/hooks/stores";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const useCreateDocDialog = () => {
  const { t } = useTranslation();
  const createDoc = useDocumentStore((state) => state.createDoc);
  const openDoc = useDocumentStore((state) => state.openDoc);

  return useCallback(
    async (parentId: string | null) => {
      try {
        const doc = await createDoc({
          parent_id: parentId,
          title: "",
        });
        await openDoc(doc.id);
      } catch (error: any) {
        toast.error(error?.message ?? t("common.settings.createFailed"));
      }
    },
    [createDoc, openDoc, t]
  );
};
