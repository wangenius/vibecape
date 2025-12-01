import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { TbTrash } from "react-icons/tb";
import { LoreItem } from "../types";

interface SubLoreItemProps {
  config: LoreItem;
}

export const SubLoreItem = ({ config }: SubLoreItemProps) => (
  <div
    className="group rounded-lg pl-3 pr-2 py-2
               transition-all duration-200 bg-muted/50 hover:bg-muted"
  >
    <div>
      <div className="flex items-center justify-between gap-3">
        <Input
          key={`name-${config.id}`} // 确保切换lore时重置输入框
          variant="ghost"
          defaultValue={config.name}
          placeholder="未命名设定"
          className="h-6 px-0 text-sm font-medium border-0 focus-visible:ring-0 rounded-none"
          onChange={(e) =>
            useCosmos
              .getState()
              .updateLore(config.id, { name: e.target.value as string })
          }
        />

        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={() => useCosmos.getState().removeLore(config.id)}
        >
          <TbTrash className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 min-w-0">
        <AutoResizeTextarea
          key={`desc-${config.id}`} // 确保切换lore时重置输入框
          variant="ghost"
          defaultValue={config.description}
          placeholder="添加描述..."
          className="w-full mt-0.5 text-xs text-muted-foreground border-0 focus-visible:ring-0 p-0 rounded-none"
          onValueChange={(e) =>
            useCosmos
              .getState()
              .updateLore(config.id, { description: e as string })
          }
        />
      </div>
    </div>
  </div>
);
