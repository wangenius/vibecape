/**
 * Tiptap 编辑器工具函数
 * 替代原有的 SlateTools
 */

import { Editor } from '@tiptap/core';

export abstract class TiptapTools {
  /**
   * 获取当前光标前的指定长度的文本
   */
  static getTextBeforeCursor(editor: Editor, length: number = 200): string {
    const { from } = editor.state.selection;
    const startPos = Math.max(0, from - length);
    return editor.state.doc.textBetween(startPos, from, '\n');
  }

  /**
   * 获取当前光标后的指定长度的文本
   */
  static getTextAfterCursor(editor: Editor, length: number = 200): string {
    const { from } = editor.state.selection;
    const endPos = Math.min(editor.state.doc.content.size, from + length);
    return editor.state.doc.textBetween(from, endPos, '\n');
  }

  /**
   * 检查光标后是否为空格或行尾
   */
  static getAfter(editor: Editor): RegExpMatchArray | null {
    const afterText = this.getTextAfterCursor(editor, 1);
    return afterText.match(/^(\s|$)/);
  }

  /**
   * 获取当前选中的文本
   */
  static getSelectedText(editor: Editor): string {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, '\n');
  }

  /**
   * 获取编辑器全部文本内容
   */
  static getAllText(editor: Editor): string {
    return editor.state.doc.textContent;
  }

  /**
   * 在光标位置插入文本
   */
  static insertText(editor: Editor, text: string): boolean {
    return editor.commands.insertContent(text);
  }

  /**
   * 替换选中的文本
   */
  static replaceSelectedText(editor: Editor, text: string): boolean {
    const { from, to } = editor.state.selection;
    return editor.commands.insertContentAt({ from, to }, text);
  }

  /**
   * 获取当前光标位置
   */
  static getCursorPosition(editor: Editor): number {
    return editor.state.selection.from;
  }

  /**
   * 设置光标位置
   */
  static setCursorPosition(editor: Editor, position: number): boolean {
    return editor.commands.setTextSelection(position);
  }
}

