/**
 * 防抖保存工具
 * 
 * 使用示例:
 * ```typescript
 * // 创建保存器
 * const saver = createDebounceSave(async (data) => {
 *   await window.api.save(data);
 * });
 * 
 * // 使用
 * saver.save(data);           // 防抖保存
 * await saver.saveNow();      // 立即保存
 * saver.cancel();             // 取消保存
 * ```
 */

export interface DebounceSaver<T> {
  /** 触发防抖保存 */
  save: (data: T) => void;
  /** 立即保存 */
  saveNow: () => Promise<void>;
  /** 取消保存 */
  cancel: () => void;
}

/**
 * 创建防抖保存器
 * @param saveFn 保存函数
 * @param delay 延迟时间（毫秒），默认 1000ms
 */
export function createDebounceSave<T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 1000
): DebounceSaver<T> {
  let timer: NodeJS.Timeout | null = null;
  let isSaving = false;
  let pendingData: T | null = null;

  const executeSave = async () => {
    if (isSaving || !pendingData) return;

    const dataToSave = pendingData;
    pendingData = null;

    try {
      isSaving = true;
      await saveFn(dataToSave);
    } finally {
      isSaving = false;
    }
  };

  return {
    save: (data: T) => {
      pendingData = data;

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        executeSave();
        timer = null;
      }, delay);
    },

    saveNow: async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      await executeSave();
    },

    cancel: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pendingData = null;
    },
  };
}
