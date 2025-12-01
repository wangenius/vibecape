/**
 * 角色状态下单条设定的配置
 */
export interface LoreStateConfig {
  id: string;
  kind: "select" | "text";
  key: string;
  value: string[];
}
