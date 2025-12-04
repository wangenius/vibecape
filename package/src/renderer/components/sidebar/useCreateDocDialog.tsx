import { useCallback } from "react";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const useCreateDocDialog = () => {
  const { t } = useTranslation();
  const createDoc = useVibecapeStore((state) => state.createDoc);
  const openDoc = useVibecapeStore((state) => state.openDoc);

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
