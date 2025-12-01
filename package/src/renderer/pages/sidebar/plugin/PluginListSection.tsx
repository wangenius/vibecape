import { Button } from "@/components/ui/button";
import { usePluginStore } from "@/PluginManager";

export const PluginListSection = () => {
  const items = usePluginStore((state) => state.sidebarItems);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 flex-none items-center border-b border-border px-4">
        <span className="text-sm font-medium">插件</span>
      </div>
      <div className="flex-1 p-4 space-y-2">
        {items.map((item) => (
           <Button
             key={item.id}
             variant="ghost"
             className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
             onClick={item.action}
           >
             <item.icon className="h-4 w-4" />
             <span>{item.label}</span>
           </Button>
        ))}
      </div>
    </div>
  );
};
