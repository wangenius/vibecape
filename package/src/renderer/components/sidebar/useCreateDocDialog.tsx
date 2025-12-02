import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";

export const useCreateDocDialog = () => {
  const createDoc = useVibecapeStore((state) => state.createDoc);

  return useCallback(
    (parentId: string | null) => {
      let title = "";
      dialog({
        title: "新建文档",
        className: "max-w-sm",
        content: (
          <Input
            placeholder="输入文档名称"
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
              取消
            </Button>
            <Button
              size="sm"
              data-create-doc-btn
              onClick={async () => {
                if (!title.trim()) {
                  toast.error("请输入文档名称");
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    title: title.trim(),
                  });
                  toast.success("文档已创建");
                  close();
                } catch (error: any) {
                  toast.error(error?.message ?? "创建失败");
                }
              }}
            >
              创建
            </Button>
          </div>
        ),
      });
    },
    [createDoc]
  );
};
