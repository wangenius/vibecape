/**
 * 翻译命名空间常量
 * 用于标识不同的翻译模块
 */
export const NAMESPACES = {
  // 基础命名空间
  COMMON: 'common',
  HOME: 'home',
  AUTH: 'auth',
  
  // Dashboard 相关
  DASHBOARD: 'dashboard',
  DASHBOARD_COMMON: 'dashboard-common',
  DASHBOARD_CLIENT: 'dashboard-client',
  DASHBOARD_VENDOR: 'dashboard-vendor',
  
  // 客户端相关
  CLIENT: 'client',
  
  // 供应商相关
  VENDOR: 'vendor',
  
  // 其他功能模块
  COINS: 'coins',
} as const;

export type Namespace = typeof NAMESPACES[keyof typeof NAMESPACES];

