/**
 * 滚动锁定工具
 * 使用透明遮罩层阻止背景滚动，类似 Notion 的弹出菜单行为
 */

let overlayElement: HTMLDivElement | null = null;
let lockCount = 0;

/**
 * 锁定页面滚动
 * 创建一个透明遮罩层来捕获并阻止滚动事件
 */
export const lockScroll = () => {
  lockCount++;
  
  // 如果已经有遮罩层，不重复创建
  if (overlayElement) return;

  overlayElement = document.createElement('div');
  overlayElement.setAttribute('data-scroll-lock-overlay', 'true');
  overlayElement.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: auto;
    background: transparent;
  `;

  // 阻止滚动事件
  const preventScroll = (e: Event) => {
    // 检查事件目标是否在弹出菜单内部
    const target = e.target as HTMLElement;
    const isInsidePopup = target.closest('[data-tippy-root]') || 
                          target.closest('[role="dialog"]') ||
                          target.closest('[data-radix-popper-content-wrapper]');
    
    // 如果在弹出菜单内部，允许滚动（菜单内部的滚动）
    if (isInsidePopup) return;
    
    e.preventDefault();
    e.stopPropagation();
  };

  overlayElement.addEventListener('wheel', preventScroll, { passive: false });
  overlayElement.addEventListener('touchmove', preventScroll, { passive: false });
  
  // 点击遮罩层时不做任何事（让事件穿透到下面的 tippy）
  overlayElement.style.pointerEvents = 'none';
  
  document.body.appendChild(overlayElement);

  // 同时在 document 上阻止滚动
  document.addEventListener('wheel', preventScroll, { passive: false });
  document.addEventListener('touchmove', preventScroll, { passive: false });
  
  // 保存引用以便清理
  (overlayElement as any)._preventScroll = preventScroll;
};

/**
 * 解锁页面滚动
 * 移除遮罩层
 */
export const unlockScroll = () => {
  lockCount--;
  
  // 只有当所有锁都释放时才移除遮罩层
  if (lockCount > 0) return;
  lockCount = 0; // 防止负数
  
  if (overlayElement) {
    const preventScroll = (overlayElement as any)._preventScroll;
    if (preventScroll) {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    overlayElement.remove();
    overlayElement = null;
  }
};
