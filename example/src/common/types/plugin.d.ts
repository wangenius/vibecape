import { IpcMainInvokeEvent } from "electron";

// 主进程上下文 (Host 提供给插件的能力)
export interface PluginMainContext {
  ipcHandle: (channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>) => void;
  getDbPath: () => string; // 获取专属数据库路径
}

// 渲染进程上下文
export interface PluginRendererContext {
  registerSidebarItem: (item: { id: string; label: string; icon: any; action: () => void }) => void;
  registerView: (viewId: string, component: React.ComponentType<any>) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  openView: (viewId: string, title?: string) => void;
}

// 插件定义
export interface JezzPlugin {
  id: string;
  onMainLoad?: (ctx: PluginMainContext) => void;     // 主进程加载时调用
  onRendererLoad?: (ctx: PluginRendererContext) => void; // 渲染进程加载时调用
}
