import { useEffect } from 'react';

// 定义具体的按键类型
type ModifierKeys = 'Shift' | 'Control' | 'Alt' | 'Meta';
type FunctionKeys =
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12';
type NavigationKeys =
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'End'
  | 'Home'
  | 'PageDown'
  | 'PageUp';
type ActionKeys = 'Enter' | 'Tab' | 'Escape' | 'Backspace' | 'Delete' | 'Space';
type AlphanumericKeys =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

type ValidKeys =
  | ModifierKeys
  | FunctionKeys
  | NavigationKeys
  | ActionKeys
  | AlphanumericKeys;

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyConfig {
  key: ValidKeys;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

/**
 * 自定义钩子用于处理键盘事件
 * @param keyConfig 键盘配置角色
 * @param handler 处理函数
 * @param deps 依赖数组
 */
const useKey = (
  keyConfig: KeyConfig | ValidKeys,
  handler: KeyHandler,
  deps: any[] = []
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const config =
        typeof keyConfig === 'string' ? { key: keyConfig } : keyConfig;

      if (
        event.key.toLowerCase() === config.key.toLowerCase() &&
        (!config.ctrlKey || event.ctrlKey) &&
        (!config.altKey || event.altKey) &&
        (!config.shiftKey || event.shiftKey)
      ) {
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [keyConfig, handler, ...deps]);
};

export default useKey;
