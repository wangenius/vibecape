import { EventEmitter } from "events";

// 定义事件类型
export interface ActivityEvent {
  cosmosId: string;
  type: 'cosmos' | 'novel' | 'word_count';
  delta?: number;
  oncePerDay?: boolean;
}

export interface DbChangeEvent {
  cosmosId: string;
  tableName: string;
  operation: string;
}

declare interface AppEventBus {
  on(event: 'activity', listener: (data: ActivityEvent) => void): this;
  emit(event: 'activity', data: ActivityEvent): boolean;

  on(event: 'db:change', listener: (data: DbChangeEvent) => void): this;
  emit(event: 'db:change', data: DbChangeEvent): boolean;
}

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();
