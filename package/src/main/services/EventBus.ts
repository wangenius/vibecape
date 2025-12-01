import { EventEmitter } from "events";

// 定义事件类型
export interface ActivityEvent {
  storyId?: string;
  type: "docs" | "chat" | "system";
  delta?: number;
  oncePerDay?: boolean;
}

export interface DocsChangeEvent {
  storyId: string;
  path?: string;
  operation: "create" | "update" | "delete" | "refresh";
}

declare interface AppEventBus {
  on(event: "activity", listener: (data: ActivityEvent) => void): this;
  emit(event: "activity", data: ActivityEvent): boolean;

  on(event: "docs:change", listener: (data: DocsChangeEvent) => void): this;
  emit(event: "docs:change", data: DocsChangeEvent): boolean;
}

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();
