import { AsyncButton } from "@/components/custom/AsyncButton";
import { dialog } from "@/components/custom/DialogModal";
import { Empty } from "@/components/custom/Empty";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Button } from "@/components/ui/button";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { TbPlus } from "react-icons/tb";
import { LoreHeader } from "./components/LoreHeader";
import { LoreTypeSelector } from "./components/LoreTypeSelector";
import { SubLoreItem } from "./components/SubLoreItem";
import { LoreItem } from "./types";

export const LoreCard = ({ id }: { id?: string }) => {
  const lores = useCosmos((state) => state.lores);
  const lore_types = useCosmos((state) => state.lore_types);

  const item = lores?.[id || ""] as LoreItem;

  if (!item) return <Empty className={"w-full mt-40"} />;

  const subConfigs = Object.values(lores || {}).filter(
    (it) => it.parent_id == item.id
  ) as LoreItem[];

  const handleDelete = () => {
    dialog.confirm({
      title: "删除设定",
      content: "确定要删除该设定吗？",
      onOk: () => useCosmos.getState().removeLore(item.id),
    });
  };

  return (
    <div>
      <div className="bg-background">
        <div className="max-w-[850px] space-y-2 mx-auto px-4 py-4">
          <LoreHeader item={item} onDelete={handleDelete} />
          <LoreTypeSelector item={item} lore_types={lore_types || {}} />
          <AutoResizeTextarea
            key={item.id} // 确保切换lore时重置输入框
            className="text-xs"
            defaultValue={item.description}
            placeholder="描述设定的基本特征和用途..."
            onValueChange={(value: string) =>
              useCosmos.getState().updateLore(item.id, { description: value as string })
            }
          />
        </div>
      </div>

      <div className="flex px-4 items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-medium">子设定</h3>
          <span className="text-xs text-muted-foreground rounded-full px-2 py-0.5 bg-muted">
            {subConfigs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => useCosmos.getState().insertLore({ parent_id: item.id })}
            className="text-xs"
            size="icon"
          >
            <TbPlus className="h-4 w-4" />
          </Button>
          <AsyncButton
            onClick={async () => {
              // const text = `${item.name}\n${item.description}`;
              //   const { channel } = await window.api.ai.parseLoreStart({ text });
              // const ipc = window.electron?.ipcRenderer;
              // if (ipc) {
              //   const handler = (_e: unknown, payload: any) => {
              //     if (payload?.type === "end" || payload?.type === "error") {
              //       ipc.removeAllListeners(channel);
              //     }
              //   };
              //   ipc.on(channel, handler);
              // }
            }}
            className="text-xs"
          >
            AI添加
          </AsyncButton>
        </div>
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-4">
        {subConfigs.length === 0 ? (
          <Empty content="暂无子设定" />
        ) : (
          <div className="grid gap-2.5 pb-4">
            {subConfigs.map((config) => (
              <SubLoreItem key={config.id} config={config} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
