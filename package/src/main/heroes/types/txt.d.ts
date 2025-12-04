/**
 * txt 文件类型声明
 */
declare module "*.txt?raw" {
  const content: string;
  export default content;
}
