import { PluginRendererContext } from "@common/types/plugin";
import { BarChart2 } from "lucide-react";
import { CosmosStatsView } from "./view";

export function onRendererLoad(ctx: PluginRendererContext) {
  // 注册视图
  ctx.registerView("stats", CosmosStatsView);

  // 注册侧边栏按钮
  ctx.registerSidebarItem({
    id: "open-stats",
    label: "数据统计",
    icon: BarChart2,
    action: () => {
      console.log("Open Stats Tab"); 
      ctx.openView("stats", "数据统计");
      // 实际调用 IPC 获取数据 (just for demo/verification)
      ctx.invoke("get-daily", 7).then(data => console.log("[StatsPlugin] 7-day Data:", data));
    }
  });
}
