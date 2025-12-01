import { create } from "zustand";
import { PluginRendererContext } from "@common/types/plugin";
import { getCurrentViewManager } from "./hook/app/useViewManager";
import StatsPlugin from "../plugins/jezz-stats/renderer";

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  action: () => void;
}

interface PluginStore {
  sidebarItems: SidebarItem[];
  views: Record<string, React.ComponentType<any>>;
  addItem: (item: SidebarItem) => void;
  registerView: (id: string, component: React.ComponentType<any>) => void;
}

export const usePluginStore = create<PluginStore>((set) => ({
  sidebarItems: [],
  views: {},
  addItem: (item) =>
    set((state) => ({ sidebarItems: [...state.sidebarItems, item] })),
  registerView: (id, component) =>
    set((state) => ({ views: { ...state.views, [id]: component } })),
}));

export function initRendererPlugins() {
  const builtInPlugins = [StatsPlugin];

  builtInPlugins.forEach((plugin) => {
    if (plugin.onRendererLoad) {
      const context: PluginRendererContext = {
        registerSidebarItem: (item) => {
          usePluginStore.getState().addItem(item);
        },
        registerView: (id, component) => {
          usePluginStore.getState().registerView(id, component);
        },
        invoke: (channel, ...args) => {
          // Call Host IPC with prefixed channel
          // @ts-ignore
          return window.electron.ipcRenderer.invoke(
            `${plugin.id}:${channel}`,
            ...args
          );
        },
        openView: (viewId, title) => {
          getCurrentViewManager().openTab({
            type: viewId as any,
            title: title || viewId,
            closable: true,
          });
        },
      };
      plugin.onRendererLoad(context);
    }
  });
}
