/**
 * 编辑器状态管理 Store
 * 用于存储当前活跃的 Tiptap 编辑器实例引用
 */

import { create } from "zustand";
import type { Editor } from "@tiptap/core";

interface EditorState {
  /** 当前活跃的编辑器实例 */
  editor: Editor | null;
  /** 注册编辑器实例 */
  setEditor: (editor: Editor | null) => void;
  /** 聚焦到编辑器末尾 */
  focusEnd: () => void;
  /** 聚焦到编辑器开头 */
  focusStart: () => void;
  /** 聚焦到编辑器（保持当前位置） */
  focus: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  editor: null,
  
  setEditor: (editor) => set({ editor }),
  
  focusEnd: () => {
    const { editor } = get();
    if (editor) {
      editor.commands.focus("end");
    }
  },
  
  focusStart: () => {
    const { editor } = get();
    if (editor) {
      editor.commands.focus("start");
    }
  },
  
  focus: () => {
    const { editor } = get();
    if (editor) {
      editor.commands.focus();
    }
  },
}));
